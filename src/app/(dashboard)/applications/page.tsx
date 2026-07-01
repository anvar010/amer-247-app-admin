import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusSelect } from "@/components/status-select";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { StatusFilterCards } from "@/components/status-filter-cards";

const PER_PAGE = 10;

const STATUS_META: Record<string, { label: string; pill: string; dot: string }> = {
  submitted: { label: "Submitted", pill: "bg-[#EAF0FA] text-[#2A5B9E]",       dot: "#2A5B9E" },
  in_review: { label: "In Review", pill: "bg-primary-bg text-amer-600",        dot: "#E24020" },
  scheduled: { label: "Scheduled", pill: "bg-[#E7F4F3] text-[#0D6B66]",       dot: "#0D6B66" },
  approved:  { label: "Approved",  pill: "bg-success-bg text-success-fg",      dot: "#0D6B66" },
  rejected:  { label: "Rejected",  pill: "bg-[#FBE9E7] text-[#B53224]",       dot: "#B53224" },
};

const STAT_CELLS = [
  { key: "all",       label: "All",       dotColor: null },
  { key: "submitted", label: "Submitted", dotColor: "#2A5B9E" },
  { key: "in_review", label: "In Review", dotColor: "#E24020" },
  { key: "scheduled", label: "Scheduled", dotColor: "#0D6B66" },
  { key: "approved",  label: "Approved",  dotColor: "#0D6B66" },
  { key: "rejected",  label: "Rejected",  dotColor: "#B53224" },
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

const ASSIGN_FILTERS = [
  { key: "all",        label: "All",          color: null },
  { key: "mine",       label: "Assigned to me", color: "#E24020" },
  { key: "unassigned", label: "Unassigned",   color: "#6B7280" },
  { key: "assigned",   label: "Assigned",     color: "#2A5B9E" },
  { key: "done",       label: "Work done",    color: "#0D6B66" },
];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; assign?: string }>;
}) {
  const { status: statusParam, q, page: pageParam, assign: assignParam } = await searchParams;
  const activeStatus = statusParam && statusParam !== "all" ? statusParam : null;
  const activeAssign = assignParam && assignParam !== "all" ? assignParam : null;
  const searchQuery  = q?.trim() ?? "";
  const page         = Math.max(1, parseInt(pageParam ?? "1", 10));

  const { user, profile, supabase } = await getSessionUser();
  const admin = createAdminClient();

  const currentRole = profile?.role ?? "user";
  const isSuperAdmin = currentRole === "super_admin";

  // Fetch permissions + app data in parallel
  const buildAppQuery = () => {
    let q = admin.from("applications").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (activeStatus) q = q.eq("status", activeStatus) as typeof q;
    if (searchQuery)  q = q.or(`ref.ilike.%${searchQuery}%,service_name.ilike.%${searchQuery}%,applicant_name.ilike.%${searchQuery}%,hub_title.ilike.%${searchQuery}%`) as typeof q;
    if (activeAssign === "mine") q = q.eq("assigned_to", user!.id) as typeof q;
    else if (activeAssign === "unassigned") q = q.is("assigned_to", null) as typeof q;
    else if (activeAssign === "assigned") q = q.in("assignment_status", ["assigned", "queued"]) as typeof q;
    else if (activeAssign === "done") q = q.eq("assignment_status", "done") as typeof q;
    return q;
  };

  const [appsResult, countResult, assignCountResult, permsResult] = await Promise.all([
    searchQuery || activeStatus || activeAssign
      ? buildAppQuery()
      : buildAppQuery().range((page - 1) * PER_PAGE, page * PER_PAGE - 1),
    admin.from("applications").select("status"),
    admin.from("applications").select("assignment_status, assigned_to"),
    !isSuperAdmin && currentRole === "admin"
      ? supabase
          .from("admin_permissions")
          .select("can_view_all_applications, can_change_application_status")
          .eq("user_id", user!.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const { data: allRows, count: appTotal } = appsResult;
  const { data: countRows } = countResult;
  const { data: assignCountRows } = assignCountResult;
  const perms = permsResult.data as { can_view_all_applications?: boolean; can_change_application_status?: boolean } | null;

  // Assignment counts
  const assignCounts: Record<string, number> = { mine: 0, assigned: 0, done: 0, unassigned: 0 };
  (assignCountRows || []).forEach((r) => {
    const s = (r as { assignment_status: string | null; assigned_to: string | null });
    if (!s.assigned_to) assignCounts.unassigned++;
    else if (s.assignment_status === "done") assignCounts.done++;
    else if (s.assignment_status === "assigned" || s.assignment_status === "queued") assignCounts.assigned++;
    if (s.assigned_to === user?.id) assignCounts.mine++;
  });

  let canViewApplications = isSuperAdmin;
  let canChangeStatus = isSuperAdmin;
  if (!isSuperAdmin && currentRole === "admin") {
    canViewApplications = !!perms?.can_view_all_applications;
    canChangeStatus = !!perms?.can_change_application_status;
  }

  // Status counts (separate lightweight query)
  const statusCounts: Record<string, number> = {};
  (countRows || []).forEach((r) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const totalCount = (countRows || []).length;

  // Group deduplication — only in the unfiltered "All" view
  const groupCountMap = new Map<string, number>();
  const groupChildrenMap = new Map<string, typeof allRows>();
  (allRows || []).forEach((a) => {
    const gr = (a as Record<string, unknown>).group_ref as string | null;
    if (gr) {
      groupCountMap.set(gr, (groupCountMap.get(gr) || 0) + 1);
      if (!groupChildrenMap.has(gr)) groupChildrenMap.set(gr, []);
      groupChildrenMap.get(gr)!.push(a);
    }
  });
  const applications = activeStatus
    ? (allRows || [])
    : (allRows || []).filter((a) => {
        const gr = (a as Record<string, unknown>).group_ref as string | null;
        return !gr || a.ref === gr;
      });

  // Profile lookup
  const userIds = Array.from(new Set(applications.map((a) => a.user_id)));
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-5">
      <RealtimeRefresher watches={[{ table: "applications", events: ["INSERT", "UPDATE"] }]} />
      {/* Section header */}
      <div>
        <h2
          className="text-[19px] font-extrabold tracking-tight text-ink"
          style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
        >
          Applications
        </h2>
        <p className="mt-[3px] text-[13px] text-muted">Review and process submitted applications</p>
      </div>

      {/* Stat-bar filter */}
      <Suspense fallback={null}>
        <StatusFilterCards
          cells={STAT_CELLS}
          statusCounts={statusCounts}
          totalCount={totalCount}
        />
      </Suspense>

      {/* Assignment filter strip */}
      <div
        className="flex flex-wrap items-center gap-[6px] rounded-[12px] border border-line bg-surface px-[14px] py-[10px]"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <span className="mr-[4px] text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted-2">Assignment</span>
        <div className="h-[16px] w-px bg-line" />
        {ASSIGN_FILTERS.map(({ key, label, color }) => {
          const count = key === "all" ? totalCount : (assignCounts[key] ?? 0);
          const active = (activeAssign === key) || (key === "all" && !activeAssign);
          const href = (() => {
            const p = new URLSearchParams();
            if (activeStatus) p.set("status", activeStatus);
            if (searchQuery)  p.set("q", searchQuery);
            if (key !== "all") p.set("assign", key);
            const s = p.toString();
            return `/applications${s ? `?${s}` : ""}`;
          })();
          return (
            <Link
              key={key}
              href={href}
              className={`inline-flex items-center gap-[5px] rounded-[8px] px-[10px] py-[5px] text-[12.5px] font-semibold transition-all duration-150 ${
                active
                  ? "text-white"
                  : "text-muted hover:text-ink"
              }`}
              style={
                active
                  ? { background: color ?? "#E24020", boxShadow: `0 2px 8px ${(color ?? "#E24020")}40` }
                  : { background: "transparent" }
              }
            >
              {color && (
                <span
                  className="inline-block h-[6px] w-[6px] flex-shrink-0 rounded-full"
                  style={{ background: active ? "rgba(255,255,255,0.75)" : color }}
                />
              )}
              {label}
              <span
                className="rounded-full px-[6px] py-[1px] text-[10.5px] font-bold"
                style={
                  active
                    ? { background: "rgba(255,255,255,0.22)", color: "#fff" }
                    : { background: "var(--bg-card)", color: "var(--muted)" }
                }
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Table card */}
      <div
        className="rounded-[var(--r-lg)] border border-line bg-surface"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          <h3
            className="text-[16px] font-bold text-ink"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            {activeStatus ? (STATUS_META[activeStatus]?.label ?? activeStatus) : "All applications"}
          </h3>
          <div className="ml-auto flex items-center gap-3">
            <SearchInput placeholder="Search ref, name, service…" />
            <a
              href={`/api/export/applications?${new URLSearchParams({
                ...(activeStatus ? { status: activeStatus } : {}),
                ...(searchQuery  ? { q: searchQuery }       : {}),
              }).toString()}`}
              className="flex h-[34px] items-center gap-[6px] rounded-[9px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-muted-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </a>
            <span className="rounded-full bg-bg-card px-3 py-[3px] text-[11px] font-semibold text-muted">
              {applications.length} shown
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line-2">
                {["Reference", "Applicant", "Service", "Fee", "Location", "Submitted", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-muted-2 first:pl-[22px] last:pr-[22px]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-[22px] py-16 text-center">
                    <div className="mx-auto mb-[14px] flex h-14 w-14 items-center justify-center rounded-[16px] bg-bg-card text-muted-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                        <rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>
                      </svg>
                    </div>
                    <p className="text-[13.5px] text-muted">No applications found.</p>
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const profile = profileMap.get(app.user_id);
                  const groupCount = groupCountMap.get(app.ref);
                  const ini = initials(profile?.full_name || profile?.email || "?");
                  const appExt = app as typeof app & { assigned_to?: string | null; assignment_status?: string | null };
                  const assignBadge =
                    appExt.assignment_status === "done"      ? { label: "Done",       bg: "#E7F4F3", color: "#0D6B66" } :
                    appExt.assignment_status === "queued"    ? { label: "Queued",     bg: "#FFF8E7", color: "#A6822F" } :
                    appExt.assignment_status === "assigned"  ? { label: "Assigned",   bg: "#EAF0FA", color: "#2A5B9E" } :
                    null;
                  return (
                    <tr key={app.id} className="border-b border-line-2 transition-colors last:border-none hover:bg-bg-card">
                      {/* Reference */}
                      <td className="py-[14px] pl-[22px] pr-4">
                        <div className="flex items-center gap-2">
                          {canViewApplications ? (
                            <Link
                              href={`/applications/${app.id}`}
                              className="text-[12.5px] font-bold text-ink hover:text-amer-700"
                              style={{ fontFamily: "var(--font-outfit)" }}
                            >
                              {app.ref}
                            </Link>
                          ) : (
                            <span className="text-[12.5px] font-bold text-muted" style={{ fontFamily: "var(--font-outfit)" }}>
                              {app.ref}
                            </span>
                          )}
                          {groupCount && groupCount > 1 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-[10px] bg-amer-700 px-1.5 text-[10px] font-bold text-white">
                              {groupCount}
                            </span>
                          )}
                          {assignBadge && (
                            <span
                              className="inline-flex items-center rounded-full px-[6px] py-[2px] text-[10px] font-bold"
                              style={{ background: assignBadge.bg, color: assignBadge.color }}
                            >
                              {assignBadge.label}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Applicant */}
                      <td className="px-4 py-[14px]">
                        <div className="flex items-center gap-[11px]">
                          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-bg-card text-[13px] font-bold text-amer-700">
                            {ini}
                          </div>
                          <div>
                            <div className="text-[13.5px] font-semibold text-ink">{profile?.full_name || "—"}</div>
                            {profile?.email && (
                              <div className="text-[11.5px] text-muted-2">{profile.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Service */}
                      <td className="px-4 py-[14px]">
                        <div className="text-[13.5px] font-medium text-ink">{app.service_name}</div>
                        {app.hub_title && (
                          <div className="mt-[2px] text-[11.5px] text-muted-2">{app.hub_title}</div>
                        )}
                      </td>
                      {/* Fee */}
                      <td className="px-4 py-[14px] text-[13.5px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                        {app.fee != null ? `AED ${app.fee}` : "—"}
                      </td>
                      {/* Location */}
                      <td className="px-4 py-[14px] text-[13px] capitalize text-muted">{app.location || "—"}</td>
                      {/* Submitted */}
                      <td className="whitespace-nowrap px-4 py-[14px] text-[13px] text-muted">
                        {new Date(app.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      {/* Status */}
                      <td className="py-[14px] pl-4 pr-[22px]">
                        {groupCount && groupCount > 1 ? (
                          <div className="flex flex-col gap-[5px]">
                            {(groupChildrenMap.get(app.ref) || []).map((child) => (
                              <span
                                key={child.id}
                                className={`inline-flex w-fit items-center gap-[6px] rounded-full px-3 py-[4px] text-[12px] font-semibold ${STATUS_META[child.status]?.pill ?? "bg-bg-card text-muted"}`}
                              >
                                <span
                                  className="h-[6px] w-[6px] flex-shrink-0 rounded-full"
                                  style={{ background: STATUS_META[child.status]?.dot ?? "#9CA3AF" }}
                                />
                                {STATUS_META[child.status]?.label ?? child.status}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <StatusSelect
                            applicationId={app.id}
                            status={app.status}
                            refundStatus={(app as typeof app & { refund_status?: string | null }).refund_status}
                            rejectionReason={app.rejection_reason}
                            userId={app.user_id}
                            serviceName={app.service_name}
                            canEdit={canChangeStatus}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — hidden when searching or status-filtering */}
        {!searchQuery && !activeStatus && (
          <Pagination page={page} total={appTotal ?? 0} perPage={PER_PAGE} />
        )}
      </div>
    </div>
  );
}
