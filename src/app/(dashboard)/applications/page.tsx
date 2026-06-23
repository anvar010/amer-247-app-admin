import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "@/components/status-select";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { RealtimeRefresher } from "@/components/realtime-refresher";

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

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status: statusParam, q, page: pageParam } = await searchParams;
  const activeStatus = statusParam && statusParam !== "all" ? statusParam : null;
  const searchQuery  = q?.trim() ?? "";
  const page         = Math.max(1, parseInt(pageParam ?? "1", 10));

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from("profiles").select("role").eq("id", user!.id).single();
  const currentRole = currentProfile?.role ?? "user";
  const isSuperAdmin = currentRole === "super_admin";

  let canViewApplications = isSuperAdmin;
  let canChangeStatus = isSuperAdmin;
  if (!isSuperAdmin && currentRole === "admin") {
    const { data: perms } = await supabase
      .from("admin_permissions")
      .select("can_view_all_applications, can_change_application_status")
      .eq("user_id", user!.id)
      .maybeSingle();
    canViewApplications = !!(perms as { can_view_all_applications?: boolean } | null)?.can_view_all_applications;
    canChangeStatus = !!(perms as { can_change_application_status?: boolean } | null)?.can_change_application_status;
  }

  // Fetch apps with count — search shows all results, otherwise paginate
  const buildAppQuery = () => {
    let q = supabase.from("applications").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (activeStatus) q = q.eq("status", activeStatus) as typeof q;
    if (searchQuery)  q = q.or(`ref.ilike.%${searchQuery}%,service_name.ilike.%${searchQuery}%,applicant_name.ilike.%${searchQuery}%,hub_title.ilike.%${searchQuery}%`) as typeof q;
    return q;
  };
  const { data: allRows, count: appTotal } = searchQuery || activeStatus
    ? await buildAppQuery()
    : await buildAppQuery().range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

  // Status counts (separate lightweight query)
  const { data: countRows } = await supabase.from("applications").select("status");
  const statusCounts: Record<string, number> = {};
  (countRows || []).forEach((r) => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
  const totalCount = (countRows || []).length;

  // Group deduplication — only in the unfiltered "All" view
  const groupCountMap = new Map<string, number>();
  (allRows || []).forEach((a) => {
    const gr = (a as Record<string, unknown>).group_ref as string | null;
    if (gr) groupCountMap.set(gr, (groupCountMap.get(gr) || 0) + 1);
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
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
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
      <div className="grid grid-cols-3 gap-[10px] sm:grid-cols-6">
        {STAT_CELLS.map(({ key, label, dotColor }) => {
          const count = key === "all" ? totalCount : (statusCounts[key] ?? 0);
          const active = (activeStatus === key) || (key === "all" && !activeStatus);
          return (
            <Link
              key={key}
              href={key === "all" ? "/applications" : `/applications?status=${key}`}
              className={`flex flex-col gap-3 rounded-[14px] border bg-surface p-[13px_14px] text-left transition-all hover:-translate-y-[1px] ${
                active
                  ? "border-amer-700"
                  : "border-line hover:border-muted-2"
              }`}
              style={{ boxShadow: active ? "inset 0 0 0 1px var(--amer-700), var(--shadow-card)" : "var(--shadow-card)" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-[9px]"
                  style={dotColor ? { background: dotColor + "22", color: dotColor } : { background: "#F6F8FC", color: "#1A1A1A" }}
                >
                  {key === "all" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor">
                      <circle cx="5" cy="5" r="5"/>
                    </svg>
                  )}
                </span>
              </div>
              <div
                className="text-[22px] font-extrabold leading-none tracking-tight text-ink"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {count}
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-semibold text-muted">
                {label}
              </div>
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
                        <StatusSelect
                          applicationId={app.id}
                          status={app.status}
                          rejectionReason={app.rejection_reason}
                          userId={app.user_id}
                          serviceName={app.service_name}
                          canEdit={canChangeStatus}
                        />
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
