import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPermissions } from "@/components/admin-permissions";

const APP_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  submitted: { bg: "rgba(42,91,158,0.12)",  color: "#2A5B9E", label: "Submitted" },
  in_review: { bg: "rgba(226,64,32,0.12)",  color: "#E24020", label: "In Review" },
  scheduled: { bg: "rgba(13,107,102,0.12)", color: "#0D6B66", label: "Scheduled" },
  approved:  { bg: "rgba(13,107,102,0.12)", color: "#0D6B66", label: "Approved"  },
  rejected:  { bg: "rgba(181,50,36,0.12)",  color: "#B53224", label: "Rejected"  },
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const cardCls    = "rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden";
const cardShadow = { boxShadow: "var(--shadow-card)" };

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user: currentUser, profile: currentProfile } = await getSessionUser();
  const isSuperAdmin = currentProfile?.role === "super_admin";
  if (!isSuperAdmin) notFound();

  const admin = createAdminClient();

  const { data: profile } = await admin.from("profiles").select("*").eq("id", id).single();
  if (!profile || !["admin", "super_admin"].includes(profile.role as string)) notFound();

  const [
    { data: completedApps },
    { data: activeApp },
    { data: permRow },
  ] = await Promise.all([
    // Applications this staff member completed (assigned_to = id AND assignment_status = done)
    admin
      .from("applications")
      .select("id, ref, service_name, status, fee, created_at, hub_title")
      .eq("assigned_to", id)
      .eq("assignment_status", "done")
      .order("created_at", { ascending: false }),

    // Currently active applications
    admin
      .from("applications")
      .select("id, ref, service_name, status, fee, created_at, hub_title, assignment_status")
      .eq("assigned_to", id)
      .in("assignment_status", ["assigned", "queued"])
      .order("created_at", { ascending: false }),

    // Permissions (if admin role)
    profile.role === "admin"
      ? admin.from("admin_permissions").select("*").eq("user_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const ini    = initials((profile.full_name as string) || (profile.email as string) || "?");
  const done   = completedApps || [];
  const active = activeApp || [];
  const staffStatus = (profile.staff_status as string) || "free";
  const isFree = staffStatus === "free";

  const ROLE_PILL: Record<string, { bg: string; color: string; label: string }> = {
    super_admin: { bg: "rgba(27,163,156,0.13)", color: "#0D6B66", label: "Super Admin" },
    admin:       { bg: "rgba(226,64,32,0.12)",  color: "#E24020", label: "Admin"       },
  };
  const rolePill = ROLE_PILL[profile.role as string] ?? ROLE_PILL.admin;

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <Link href="/staff" className="transition-colors hover:text-ink">Staff & roles</Link>
        <span>/</span>
        <span className="font-medium text-ink">{(profile.full_name as string) || (profile.email as string) || "Staff"}</span>
      </div>

      {/* Hero card */}
      <div className={cardCls} style={cardShadow}>
        <div className="flex items-center gap-5 px-[26px] py-[22px]">
          <div
            className="flex h-[62px] w-[62px] flex-shrink-0 items-center justify-center rounded-[18px] text-[22px] font-extrabold text-white"
            style={{ background: "linear-gradient(155deg,#E24020,#7A1508)", fontFamily: "var(--font-outfit)" }}
          >
            {ini}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className="text-[20px] font-extrabold tracking-tight text-ink"
                style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
              >
                {(profile.full_name as string) || "—"}
              </h1>
              <span
                className="inline-flex items-center rounded-full px-[10px] py-[3px] text-[11px] font-bold"
                style={{ background: rolePill.bg, color: rolePill.color }}
              >
                {rolePill.label}
              </span>
              {/* Staff status */}
              <span
                className="inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[11px] font-bold"
                style={{
                  background: isFree ? "#E7F4F3" : "rgba(255,81,47,0.12)",
                  color: isFree ? "#0D6B66" : "#E24020",
                }}
              >
                <span
                  className="inline-block h-[5px] w-[5px] rounded-full"
                  style={{ background: isFree ? "#0D6B66" : "#E24020" }}
                />
                {isFree ? "Free" : "Engaged"}
              </span>
            </div>
            <div className="mt-[4px] flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
              {profile.email && <span>{profile.email as string}</span>}
              {profile.mobile && <span>{profile.mobile as string}</span>}
              <span>Joined {fmt(profile.created_at as string)}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden flex-shrink-0 items-center gap-[28px] sm:flex">
            <div className="text-center">
              <div className="text-[22px] font-extrabold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                {done.length}
              </div>
              <div className="text-[11.5px] text-muted">Completed</div>
            </div>
            <div className="h-8 w-px bg-line" />
            <div className="text-center">
              <div
                className="text-[22px] font-extrabold"
                style={{ fontFamily: "var(--font-outfit)", color: active.length > 0 ? "#E24020" : "#6B7280" }}
              >
                {active.length}
              </div>
              <div className="text-[11.5px] text-muted">Active now</div>
            </div>
          </div>
        </div>

        {/* Active applications banner */}
        {active.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-[26px] py-[13px]"
            style={{ background: "rgba(226,64,32,0.04)" }}
          >
            <span className="inline-block h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-amer-700" />
            <p className="text-[13px] font-medium text-ink">
              {active.length === 1 ? "Currently working on" : `${active.length} active applications:`}
            </p>
            {active.slice(0, 3).map((a) => (
              <Link key={a.id as string} href={`/applications/${a.id}`} className="text-[13px] font-bold text-amer-700 hover:underline">
                {a.ref as string}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_290px]">

        {/* LEFT — Active + Completed applications */}
        <div className="flex flex-col gap-5">

        {/* Active applications */}
        {active.length > 0 && (
        <div className={cardCls} style={cardShadow}>
          <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amer-700" />
            <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
              Active applications
            </h3>
            <span className="ml-auto rounded-full bg-primary-bg px-3 py-[3px] text-[11px] font-semibold text-amer-600">
              {active.length} in progress
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line-2">
                  {["Reference", "Service", "Fee", "Submitted", "Status", "Queue"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-muted-2 first:pl-[22px] last:pr-[22px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map((app) => {
                  const st = APP_STATUS[app.status as string] ?? { bg: "var(--bg-card)", color: "var(--muted)", label: app.status };
                  const isQueued = app.assignment_status === "queued";
                  return (
                    <tr key={app.id as string} className="border-b border-line-2 transition-colors last:border-none hover:bg-bg-card">
                      <td className="py-[13px] pl-[22px] pr-4">
                        <Link href={`/applications/${app.id}`} className="text-[12.5px] font-bold text-ink hover:text-amer-700" style={{ fontFamily: "var(--font-outfit)" }}>
                          {app.ref as string}
                        </Link>
                      </td>
                      <td className="px-4 py-[13px]">
                        <div className="text-[13px] font-medium text-ink">{app.service_name as string}</div>
                        {app.hub_title && <div className="mt-[2px] text-[11.5px] text-muted-2">{app.hub_title as string}</div>}
                      </td>
                      <td className="px-4 py-[13px] text-[13px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                        {app.fee != null ? `AED ${app.fee}` : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-[13px] text-[13px] text-muted">{fmt(app.created_at as string)}</td>
                      <td className="px-4 py-[13px]">
                        <span className="inline-flex items-center rounded-full px-[10px] py-[4px] text-[11.5px] font-bold" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-[13px] pl-4 pr-[22px]">
                        {isQueued ? (
                          <span className="inline-flex items-center rounded-full bg-[#FFF8E7] px-[9px] py-[3px] text-[11px] font-bold text-[#A6822F]">Queued</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-primary-bg px-[9px] py-[3px] text-[11px] font-bold text-amer-600">Assigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Completed applications */}
        <div className={cardCls} style={cardShadow}>
          <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
            <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
              Completed applications
            </h3>
            <span className="ml-auto rounded-full bg-bg-card px-3 py-[3px] text-[11px] font-semibold text-muted">
              {done.length} total
            </span>
          </div>

          {done.length === 0 ? (
            <div className="px-[22px] py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-bg-card text-muted-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>
                </svg>
              </div>
              <p className="text-[13px] text-muted">No completed applications yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line-2">
                    {["Reference", "Service", "Fee", "Submitted", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-muted-2 first:pl-[22px] last:pr-[22px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {done.map((app) => {
                    const st = APP_STATUS[app.status as string] ?? { bg: "var(--bg-card)", color: "var(--muted)", label: app.status };
                    return (
                      <tr key={app.id as string} className="border-b border-line-2 transition-colors last:border-none hover:bg-bg-card">
                        <td className="py-[13px] pl-[22px] pr-4">
                          <Link
                            href={`/applications/${app.id}`}
                            className="text-[12.5px] font-bold text-ink hover:text-amer-700"
                            style={{ fontFamily: "var(--font-outfit)" }}
                          >
                            {app.ref as string}
                          </Link>
                        </td>
                        <td className="px-4 py-[13px]">
                          <div className="text-[13px] font-medium text-ink">{app.service_name as string}</div>
                          {app.hub_title && (
                            <div className="mt-[2px] text-[11.5px] text-muted-2">{app.hub_title as string}</div>
                          )}
                        </td>
                        <td className="px-4 py-[13px] text-[13px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                          {app.fee != null ? `AED ${app.fee}` : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-[13px] text-[13px] text-muted">
                          {fmt(app.created_at as string)}
                        </td>
                        <td className="py-[13px] pl-4 pr-[22px]">
                          <span
                            className="inline-flex items-center rounded-full px-[10px] py-[4px] text-[11.5px] font-bold"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>{/* end left column */}

        {/* RIGHT — Profile + Permissions */}
        <div className="flex flex-col gap-5">
          <div className={cardCls} style={cardShadow}>
            <div className="border-b border-line px-[22px] py-[18px]">
              <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>Profile</h3>
            </div>
            <div className="flex flex-col divide-y divide-line-2">
              {[
                { label: "Full name", value: profile.full_name as string },
                { label: "Email",     value: profile.email as string },
                { label: "Mobile",    value: profile.mobile as string },
                { label: "Role",      value: rolePill.label },
                { label: "Status",    value: isFree ? "Free" : "Engaged" },
                { label: "Joined",    value: fmt(profile.created_at as string) },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex items-start justify-between gap-3 px-[22px] py-[11px]">
                  <span className="flex-shrink-0 text-[12.5px] text-muted">{label}</span>
                  <span className="text-right text-[12.5px] font-medium text-ink">{value}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {profile.role === "admin" && (
            <AdminPermissions
              userId={id}
              initialPermissions={permRow as {
                id: string;
                can_change_application_status: boolean;
                can_view_all_applications: boolean;
                can_manage_documents: boolean;
                can_send_notifications: boolean;
              } | null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
