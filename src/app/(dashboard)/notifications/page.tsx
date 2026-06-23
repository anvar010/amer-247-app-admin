import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ComposeForm, BroadcastActions } from "./compose-form";

const AUDIENCE_LABEL: Record<string, string> = {
  all:       "All users",
  submitted: "Submitted",
  in_review: "In Review",
  scheduled: "Scheduled",
  approved:  "Approved",
  rejected:  "Rejected",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  sent:  { bg: "rgba(27,163,156,0.13)", color: "#0D6B66" },
  draft: { bg: "rgba(201,162,75,0.18)", color: "#A6822F" },
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user!.id).single();

  const isSuperAdmin = profile?.role === "super_admin";
  let canSend = isSuperAdmin;
  if (!isSuperAdmin && profile?.role === "admin") {
    const { data: perms } = await supabase
      .from("admin_permissions")
      .select("can_send_notifications")
      .eq("user_id", user!.id)
      .maybeSingle();
    canSend = !!(perms as { can_send_notifications?: boolean } | null)?.can_send_notifications;
  }
  if (!canSend) redirect("/unauthorized");

  const admin = createAdminClient();
  const { data: broadcasts } = await admin
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = broadcasts || [];
  const sentCount  = rows.filter((b) => b.status === "sent").length;
  const draftCount = rows.filter((b) => b.status === "draft").length;
  const totalReach = rows.reduce((s, b) => s + (b.reach ?? 0), 0);

  const cardCls   = "rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden";
  const cardShadow = { boxShadow: "var(--shadow-card)" };

  return (
    <div className="flex flex-col gap-5">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total broadcasts", value: rows.length, icoStyle: { background: "rgba(255,81,47,0.12)", color: "#E24020" }, icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
          { label: "Drafts saved",    value: draftCount, icoStyle: { background: "rgba(201,162,75,0.18)", color: "#A6822F" }, icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> },
          { label: "Total reach",     value: totalReach.toLocaleString(), icoStyle: { background: "rgba(27,163,156,0.13)", color: "#0D6B66" }, icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
        ].map((k) => (
          <div key={k.label} className="rounded-[var(--r-lg)] border border-line bg-surface p-[18px]" style={cardShadow}>
            <div className="flex items-center justify-between">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px]" style={k.icoStyle}>
                {k.icon}
              </div>
            </div>
            <div className="mt-[14px] text-[30px] font-extrabold leading-none tracking-tight text-ink" style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}>
              {k.value}
            </div>
            <div className="mt-[5px] text-[13px] text-muted">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_360px]">

        {/* Broadcast list */}
        <div className={cardCls} style={cardShadow}>
          <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
            <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
              Sent &amp; drafts
            </h3>
            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-full bg-bg-card px-[10px] py-[3px] text-[11px] font-semibold text-muted">
                {rows.length} total
              </span>
              {sentCount > 0 && (
                <span className="rounded-full px-[10px] py-[3px] text-[11px] font-semibold" style={{ background: "rgba(27,163,156,0.13)", color: "#0D6B66" }}>
                  {sentCount} sent
                </span>
              )}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="px-[22px] py-16 text-center">
              <div className="mx-auto mb-[14px] flex h-14 w-14 items-center justify-center rounded-[16px] bg-bg-card text-muted-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <p className="text-[13.5px] text-muted">No broadcasts yet. Compose one on the right.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line-2">
                    {["Title", "Audience", "Channel", "Reach", "Sent", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-muted-2 first:pl-[22px] last:pr-[22px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => {
                    const st = STATUS_STYLE[b.status] ?? { bg: "var(--bg-card)", color: "var(--muted)" };
                    return (
                      <tr key={b.id} className="border-b border-line-2 transition-colors last:border-none hover:bg-bg-card">
                        {/* Title */}
                        <td className="py-[14px] pl-[22px] pr-4">
                          <div className="flex items-center gap-[11px]">
                            <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-bg-card text-amer-700">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-[13.5px] font-semibold text-ink">{b.title}</p>
                              <p className="mt-[1px] max-w-[240px] truncate text-[11.5px] text-muted-2">{b.message}</p>
                            </div>
                          </div>
                        </td>
                        {/* Audience */}
                        <td className="px-4 py-[14px] text-[13px] text-muted">
                          {AUDIENCE_LABEL[b.audience] ?? b.audience}
                        </td>
                        {/* Channel */}
                        <td className="px-4 py-[14px] text-[13px] text-muted capitalize">
                          {b.channel}
                        </td>
                        {/* Reach */}
                        <td className="px-4 py-[14px] text-[13.5px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                          {b.reach ? b.reach.toLocaleString() : "—"}
                        </td>
                        {/* Sent at */}
                        <td className="whitespace-nowrap px-4 py-[14px] text-[13px] text-muted">
                          {b.sent_at
                            ? new Date(b.sent_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                            : <span className="italic text-muted-2">Draft</span>}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-[14px]">
                          <span className="inline-flex items-center rounded-full px-[10px] py-[4px] text-[11.5px] font-bold capitalize" style={{ background: st.bg, color: st.color }}>
                            {b.status}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="py-[14px] pl-4 pr-[22px]">
                          <BroadcastActions id={b.id} status={b.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Compose sidebar */}
        <div className={cardCls} style={cardShadow}>
          <div className="border-b border-line px-[22px] py-[18px]">
            <div className="flex items-center gap-3">
              <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] text-white" style={{ background: "linear-gradient(155deg,#E24020,#7A1508)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>Compose</h3>
                <p className="text-[11.5px] text-muted">Push to app users</p>
              </div>
            </div>
          </div>
          <div className="px-[22px] py-[20px]">
            <ComposeForm />
          </div>
        </div>
      </div>
    </div>
  );
}
