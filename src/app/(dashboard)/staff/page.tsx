import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/session";
import { AddStaffForm } from "./add-staff-form";

const ROLE_CARDS = [
  {
    role: "Super Admin",
    desc: "Full access to all console features, staff management, and system configuration.",
    perms: ["Manage staff & permissions", "All application actions", "Wallet configuration", "System settings"],
    icoClass: "bg-success-bg text-success-fg",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z" /><path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    role: "Admin",
    desc: "Operational access to applications and users. Permissions are configured per account.",
    perms: ["View applications (if permitted)", "Change application status (if permitted)", "User management"],
    icoClass: "bg-primary-bg text-amer-700",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default async function StaffPage() {
  const { profile, supabase } = await getSessionUser();

  if (profile?.role !== "super_admin") redirect("/unauthorized");

  const { data: staffRaw } = await supabase
    .from("staff")
    .select("id, user_id, full_name, email, role, created_at")
    .order("role")
    .order("full_name");

  // Enrich with live staff_status from profiles
  const staffUserIds = (staffRaw || []).map((s) => s.user_id).filter(Boolean);
  const { data: statusRows } = staffUserIds.length
    ? await supabase.from("profiles").select("id, staff_status").in("id", staffUserIds)
    : { data: [] as { id: string; staff_status: string | null }[] };
  const statusMap = new Map((statusRows || []).map((r) => [r.id, r.staff_status]));
  const staff = (staffRaw || []).map((s) => ({
    ...s,
    staff_status: (statusMap.get(s.user_id) as string | null) ?? "free",
  }));

  const initials = (name: string) =>
    name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  return (
    <div className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-center">
        <div className="flex-1">
          <h2
            className="text-[19px] font-extrabold tracking-tight text-ink"
            style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
          >
            Admin staff & roles
          </h2>
          <p className="mt-[3px] text-[13px] text-muted">Console users and their permissions</p>
        </div>
        <AddStaffForm />
      </div>

      {/* Role description cards */}
      <div className="grid grid-cols-2 gap-4">
        {ROLE_CARDS.map((r) => (
          <div
            key={r.role}
            className="rounded-[var(--r-lg)] border border-line bg-surface p-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="mb-2 flex items-center gap-[10px]">
              <span className={`flex h-[38px] w-[38px] items-center justify-center rounded-[11px] ${r.icoClass}`}>
                {r.icon}
              </span>
              <h4
                className="text-[16px] font-bold text-ink"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {r.role}
              </h4>
            </div>
            <p className="mb-3 text-[13px] leading-[1.5] text-muted">{r.desc}</p>
            <div className="flex flex-col gap-[2px]">
              {r.perms.map((p) => (
                <div key={p} className="flex items-center gap-2 py-[5px] text-[13px] text-text">
                  <svg className="flex-shrink-0 text-teal" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {p}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Team members table */}
      <div
        className="rounded-[var(--r-lg)] border border-line bg-surface"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          <h3
            className="text-[16px] font-bold text-ink"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Team members
          </h3>
          <span className="ml-auto rounded-full bg-bg-card px-3 py-[3px] text-[11px] font-semibold text-muted">
            {(staff || []).length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line-2">
                {["Member", "Email", "Role", "Status", "Added", "Permissions"].map((h) => (
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
              {(staff || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-[22px] py-16 text-center">
                    <div className="mx-auto mb-[14px] flex h-14 w-14 items-center justify-center rounded-[16px] bg-bg-card text-muted-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <p className="text-[13.5px] text-muted">No staff members yet. Invite someone to get started.</p>
                  </td>
                </tr>
              ) : (
                (staff || []).map((s) => (
                  <tr key={s.id} className="border-b border-line-2 transition-colors last:border-none hover:bg-bg-card">
                    {/* Member */}
                    <td className="py-[14px] pl-[22px] pr-4">
                      <div className="flex items-center gap-[11px]">
                        <div
                          className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-bg-card text-[13px] font-bold text-amer-700"
                        >
                          {initials(s.full_name || "")}
                        </div>
                        <a href={`/staff/${s.user_id}`} className="text-[13.5px] font-semibold text-ink hover:text-amer-700 hover:underline">{s.full_name}</a>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-[14px] text-[13px] text-muted">{s.email}</td>
                    {/* Role */}
                    <td className="px-4 py-[14px]">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-[10px] py-[4px] text-[11.5px] font-bold ${
                          s.role === "super_admin"
                            ? "bg-success-bg text-success-fg"
                            : "bg-primary-bg text-amer-600"
                        }`}
                      >
                        {s.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-[14px]">
                      <span
                        className="inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] text-[11.5px] font-bold"
                        style={{
                          background: s.staff_status === "engaged" ? "rgba(255,81,47,0.12)" : "#E7F4F3",
                          color: s.staff_status === "engaged" ? "#E24020" : "#0D6B66",
                        }}
                      >
                        <span
                          className="inline-block h-[6px] w-[6px] rounded-full"
                          style={{ background: s.staff_status === "engaged" ? "#E24020" : "#0D6B66" }}
                        />
                        {s.staff_status === "engaged" ? "Engaged" : "Free"}
                      </span>
                    </td>
                    {/* Added */}
                    <td className="px-4 py-[14px] text-[13px] text-muted">
                      {new Date(s.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    {/* Permissions */}
                    <td className="py-[14px] pl-4 pr-[22px]">
                      <a
                        href={`/staff/${s.user_id}`}
                        className="inline-flex h-[30px] items-center rounded-[9px] border border-line bg-bg-card px-3 text-[12px] font-semibold text-ink transition-colors hover:border-muted-2"
                      >
                        View profile
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
