import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { RealtimeRefresher } from "@/components/realtime-refresher";

const STATUS_META: Record<string, { label: string; pill: string; bar: string; dotBg: string; dotColor: string; icon: React.ReactNode }> = {
  submitted: {
    label: "Submitted", pill: "bg-[#EAF0FA] text-[#2A5B9E]", bar: "#2A5B9E",
    dotBg: "#EAF0FA", dotColor: "#2A5B9E",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  },
  in_review: {
    label: "In Review", pill: "bg-primary-bg text-amer-600", bar: "#E24020",
    dotBg: "rgba(255,81,47,0.12)", dotColor: "#E24020",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  scheduled: {
    label: "Scheduled", pill: "bg-[#E7F4F3] text-[#0D6B66]", bar: "#0D6B66",
    dotBg: "#E7F4F3", dotColor: "#0D6B66",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  approved: {
    label: "Approved", pill: "bg-success-bg text-success-fg", bar: "#1E7F4F",
    dotBg: "rgba(27,163,156,0.13)", dotColor: "#0D6B66",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/><polyline points="9 12 11 14 15 10"/></svg>,
  },
  rejected: {
    label: "Rejected", pill: "bg-[#FBE9E7] text-[#B53224]", bar: "#B53224",
    dotBg: "#FBE9E7", dotColor: "#B53224",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  },
};

const PIPELINE_STAGES = ["submitted", "in_review", "scheduled", "approved", "rejected"] as const;

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

import React from "react";

export default async function DashboardPage() {
  const { user, profile } = await getSessionUser();
  const admin = createAdminClient();

  const firstName = (profile?.full_name || user?.email?.split("@")[0] || "Admin").split(" ")[0];

  const [
    { count: totalApps },
    { count: totalUsers },
    { data: byStatus },
    { data: recent },
  ] = await Promise.all([
    admin.from("applications").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
    admin.from("applications").select("status"),
    admin
      .from("applications")
      .select("id, ref, service_name, status, fee, created_at, hub_title, user_id")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const counts: Record<string, number> = {};
  (byStatus || []).forEach((row) => { counts[row.status] = (counts[row.status] || 0) + 1; });

  const maxCount = Math.max(...PIPELINE_STAGES.map((s) => counts[s] ?? 0), 1);
  const pendingReview = (counts["submitted"] ?? 0) + (counts["in_review"] ?? 0);

  // Fetch profiles for recent apps
  const recentUserIds = Array.from(new Set((recent || []).map((a) => a.user_id).filter(Boolean)));
  const { data: recentProfiles } = recentUserIds.length
    ? await admin.from("profiles").select("id, full_name, email").in("id", recentUserIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const profileMap = new Map((recentProfiles || []).map((p) => [p.id, p]));

  // Time-based greeting
  const hr = new Date().getHours();
  const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const kpis = [
    {
      label: "Total applications",
      value: totalApps ?? 0,
      delta: "all time",
      icoStyle: { background: "rgba(255,81,47,0.12)", color: "#E24020" },
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>,
    },
    {
      label: "Pending review",
      value: pendingReview,
      delta: "need action",
      icoStyle: { background: "rgba(255,81,47,0.12)", color: "#E24020" },
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
    {
      label: "Approved",
      value: counts["approved"] ?? 0,
      delta: "completed",
      icoStyle: { background: "rgba(27,163,156,0.13)", color: "#0D6B66" },
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    },
    {
      label: "Registered users",
      value: totalUsers ?? 0,
      delta: "accounts",
      icoStyle: { background: "rgba(201,162,75,0.18)", color: "#A6822F" },
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
  ];

  const cardCls = "rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden";
  const cardShadow = { boxShadow: "var(--shadow-card)" };

  return (
    <div className="flex flex-col gap-5">
      <RealtimeRefresher watches={[
        { table: "applications", events: ["INSERT", "UPDATE"] },
        { table: "profiles",     events: ["INSERT"] },
        { table: "user_documents", events: ["INSERT", "UPDATE"] },
      ]} />

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden rounded-[var(--r-lg)] p-[26px_30px]"
        style={{
          background: "radial-gradient(130% 160% at 0% -30%, #FF512F 0%, #7A1508 72%)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.05em]" style={{ color: "#E3C77E" }}>
              {today}
            </p>
            <h2
              className="mt-[7px] text-[26px] font-extrabold leading-[1.15] tracking-tight text-white"
              style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
            >
              {greet}, {firstName}
            </h2>
            <p className="mt-[6px] text-[13.5px]" style={{ color: "rgba(255,255,255,0.82)" }}>
              You have <b className="text-white">{pendingReview} application{pendingReview !== 1 ? "s" : ""}</b> waiting on review. Here is today&apos;s snapshot.
            </p>
          </div>
          <Link
            href="/applications"
            className="flex h-[46px] flex-shrink-0 items-center gap-[9px] rounded-[13px] bg-white px-5 text-[14px] font-bold text-amer-700 transition-all hover:-translate-y-[1px]"
            style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.2)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>
            </svg>
            Review queue
          </Link>
        </div>
        {/* Dot grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(160deg, transparent, #000 70%)",
          }}
        />
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-[var(--r-lg)] border border-line bg-surface p-[18px]"
            style={cardShadow}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px]"
                style={k.icoStyle}
              >
                {k.icon}
              </div>
              <span className="rounded-full bg-bg-card px-[8px] py-[3px] text-[11.5px] font-bold text-muted">
                {k.delta}
              </span>
            </div>
            <div
              className="mt-[14px] text-[30px] font-extrabold leading-none tracking-tight text-ink"
              style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
            >
              {k.value}
            </div>
            <div className="mt-[5px] text-[13px] text-muted">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Pipeline + Activity row ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">

        {/* Application pipeline */}
        <div className={cardCls} style={cardShadow}>
          <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
            <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
              Application pipeline
            </h3>
            <div className="ml-auto">
              <span className="rounded-full bg-bg-card px-[10px] py-[3px] text-[11px] font-semibold text-muted">
                {totalApps ?? 0} active
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-[15px] px-[22px] py-[16px_22px] py-4">
            {PIPELINE_STAGES.map((s) => {
              const meta = STATUS_META[s];
              const count = counts[s] ?? 0;
              const pct = count ? Math.max((count / maxCount) * 100, 7) : 0;
              return (
                <div
                  key={s}
                  className="grid items-center gap-[14px]"
                  style={{ gridTemplateColumns: "132px 1fr 30px" }}
                >
                  <span className="flex items-center gap-[9px] text-[13px] font-semibold text-ink">
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px]"
                      style={{ background: meta.dotBg, color: meta.dotColor }}
                    >
                      {meta.icon}
                    </span>
                    {meta.label}
                  </span>
                  <div className="h-[10px] overflow-hidden rounded-full bg-bg-card">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: meta.bar }}
                    />
                  </div>
                  <span
                    className="text-right text-[15px] font-extrabold text-ink"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className={cardCls} style={cardShadow}>
          <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
            <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
              Recent activity
            </h3>
          </div>
          <div className="py-[6px]">
            {(recent || []).length === 0 ? (
              <p className="px-[22px] py-8 text-center text-[13px] text-muted">No recent activity.</p>
            ) : (
              (recent || []).slice(0, 5).map((app, i, arr) => {
                const meta = STATUS_META[app.status] ?? STATUS_META.submitted;
                const p = profileMap.get(app.user_id);
                return (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className={`flex items-center gap-[13px] px-[22px] py-[11px] transition-colors hover:bg-bg-card ${i < arr.length - 1 ? "border-b border-line-2" : ""}`}
                  >
                    <span
                      className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px]"
                      style={{ background: meta.dotBg, color: meta.dotColor }}
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-[13.5px] font-semibold text-ink">{app.service_name}</b>
                      <span className="text-[12px] text-muted">
                        {p?.full_name || p?.email || "—"} · {app.ref}
                      </span>
                    </div>
                    <span
                      className={`inline-flex flex-shrink-0 rounded-full px-[9px] py-[3px] text-[11px] font-bold ${meta.pill}`}
                    >
                      {meta.label}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Latest applications table ── */}
      <div className={cardCls} style={cardShadow}>
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
            Latest applications
          </h3>
          <div className="ml-auto">
            <Link
              href="/applications"
              className="inline-flex items-center gap-[6px] rounded-[10px] border border-line bg-surface px-3 py-[6px] text-[12.5px] font-semibold text-ink transition-colors hover:border-muted-2"
            >
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>

        {(recent || []).length === 0 ? (
          <div className="px-[22px] py-16 text-center">
            <div className="mx-auto mb-[14px] flex h-14 w-14 items-center justify-center rounded-[16px] bg-bg-card text-muted-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
            </div>
            <p className="text-[13.5px] text-muted">No applications submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line-2">
                  {["Reference", "Applicant", "Service", "Status", "Submitted", "Fee (AED)"].map((h) => (
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
                {(recent || []).map((app) => {
                  const p = profileMap.get(app.user_id);
                  const ini = initials(p?.full_name || p?.email || "?");
                  const meta = STATUS_META[app.status] ?? STATUS_META.submitted;
                  return (
                    <tr
                      key={app.id}
                      className="border-b border-line-2 transition-colors last:border-none hover:bg-bg-card"
                    >
                      {/* Reference */}
                      <td className="py-[14px] pl-[22px] pr-4">
                        <Link
                          href={`/applications/${app.id}`}
                          className="text-[12.5px] font-bold text-ink hover:text-amer-700"
                          style={{ fontFamily: "var(--font-outfit)" }}
                        >
                          {app.ref}
                        </Link>
                      </td>
                      {/* Applicant */}
                      <td className="px-4 py-[14px]">
                        <div className="flex items-center gap-[11px]">
                          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-bg-card text-[13px] font-bold text-amer-700">
                            {ini}
                          </div>
                          <span className="text-[13.5px] font-semibold text-ink">
                            {p?.full_name || p?.email || "—"}
                          </span>
                        </div>
                      </td>
                      {/* Service */}
                      <td className="px-4 py-[14px]">
                        <div className="text-[13.5px] font-medium text-ink">{app.service_name}</div>
                        {app.hub_title && (
                          <div className="mt-[2px] text-[11.5px] text-muted-2">{app.hub_title}</div>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-[14px]">
                        <span className={`inline-flex items-center rounded-full px-[10px] py-[4px] text-[11.5px] font-bold ${meta.pill}`}>
                          {meta.label}
                        </span>
                      </td>
                      {/* Submitted */}
                      <td className="whitespace-nowrap px-4 py-[14px] text-[13px] text-muted">
                        {new Date(app.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      {/* Fee */}
                      <td className="py-[14px] pl-4 pr-[22px] text-[13.5px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                        {app.fee != null ? app.fee.toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
