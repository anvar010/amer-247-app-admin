import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "@/components/status-select";
import { labelForField } from "@/lib/form-fields";

const STATUS_STEP: Record<string, number> = {
  submitted: 0, in_review: 1, scheduled: 2, approved: 3, rejected: 1,
};

const STATUS_PILL: Record<string, { bg: string; color: string; label: string }> = {
  submitted: { bg: "#EAF0FA",               color: "#2A5B9E", label: "Submitted" },
  in_review: { bg: "rgba(255,81,47,0.12)",  color: "#E24020", label: "In Review" },
  scheduled: { bg: "#E7F4F3",               color: "#0D6B66", label: "Scheduled" },
  approved:  { bg: "rgba(27,163,156,0.13)", color: "#0D6B66", label: "Approved"  },
  rejected:  { bg: "#FBE9E7",               color: "#B53224", label: "Rejected"  },
};

const STEP_DEFS = [
  { label: "Submitted", icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  )},
  { label: "In Review", icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  )},
  { label: "Scheduled", icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  )},
  { label: "Approved", icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/><polyline points="9 12 11 14 15 10"/></svg>
  )},
];

const CHECK_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const X_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

function Stepper({ status }: { status: string }) {
  const activeIdx = STATUS_STEP[status] ?? 0;
  const isRejected = status === "rejected";

  return (
    <div className="flex items-start px-[22px] py-[20px]">
      {STEP_DEFS.map((step, i) => {
        const done = i < activeIdx;
        const current = i === activeIdx;
        let dotBg = "var(--bg-card)";
        let dotBorder = "var(--line)";
        let dotColor = "var(--muted-2)";
        let dotShadow: string | undefined;
        if (done) { dotBg = "#1BA39C"; dotBorder = "#1BA39C"; dotColor = "#fff"; }
        else if (current && isRejected) { dotBg = "#C0392B"; dotBorder = "#C0392B"; dotColor = "#fff"; }
        else if (current) { dotBg = "#FF512F"; dotBorder = "#FF512F"; dotColor = "#fff"; dotShadow = "0 0 0 4px rgba(255,81,47,0.15)"; }
        const label = isRejected && current ? "Rejected" : step.label;

        return (
          <div key={step.label} className={`flex items-start ${i < STEP_DEFS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-[6px]">
              <div
                className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border-2"
                style={{ background: dotBg, borderColor: dotBorder, color: dotColor, boxShadow: dotShadow }}
              >
                {done ? CHECK_ICON : isRejected && current ? X_ICON : step.icon}
              </div>
              <span
                className="text-center text-[10.5px] font-semibold leading-tight"
                style={{ color: done || current ? "var(--ink)" : "var(--muted-2)", whiteSpace: "nowrap" }}
              >
                {label}
              </span>
            </div>
            {i < STEP_DEFS.length - 1 && (
              <div
                className="mb-[22px] mx-[6px] h-[2px] flex-1 self-center rounded-full"
                style={{ background: done ? "#1BA39C" : "var(--line)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", currentUser!.id).single();
  const currentRole = currentProfile?.role ?? "user";
  const isSuperAdmin = currentRole === "super_admin";

  let canViewApplications = isSuperAdmin;
  let canChangeStatus = isSuperAdmin;
  if (!isSuperAdmin && currentRole === "admin") {
    const { data: perms } = await supabase.from("admin_permissions")
      .select("can_view_all_applications, can_change_application_status")
      .eq("user_id", currentUser!.id).maybeSingle();
    canViewApplications = !!(perms as { can_view_all_applications?: boolean } | null)?.can_view_all_applications;
    canChangeStatus = !!(perms as { can_change_application_status?: boolean } | null)?.can_change_application_status;
  }
  if (!canViewApplications) redirect("/unauthorized");

  const { data: app } = await supabase.from("applications").select("*").eq("id", id).single();
  if (!app) notFound();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", app.user_id).single();

  const groupRef = (app as Record<string, unknown>).group_ref as string | null;
  const isGroupPrimary = !!(groupRef && app.ref === groupRef);

  type AppRow = typeof app & { applicant_name?: string | null; group_ref?: string | null };
  const groupApps: AppRow[] = [];
  if (isGroupPrimary) {
    const { data: siblings } = await supabase
      .from("applications").select("*").eq("group_ref", groupRef).order("ref");
    groupApps.push(...(siblings || []));
  }

  const appIds = isGroupPrimary ? groupApps.map((a) => a.id) : [id];
  const { data: allDocuments } = await supabase
    .from("application_documents").select("*").in("application_id", appIds).order("created_at");

  const allDocsWithUrls = await Promise.all(
    (allDocuments || []).map(async (doc) => {
      const { data: signed } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 60 * 10);
      return { ...doc, url: signed?.signedUrl ?? null };
    })
  );

  const docsByAppId = allDocsWithUrls.reduce<Record<string, typeof allDocsWithUrls>>((acc, doc) => {
    const aid = doc.application_id;
    if (!acc[aid]) acc[aid] = [];
    acc[aid].push(doc);
    return acc;
  }, {});

  const pill = STATUS_PILL[app.status] ?? { bg: "var(--bg-card)", color: "var(--muted)", label: app.status };
  const cardCls = "rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden";
  const cardShadow = { boxShadow: "var(--shadow-card)" };

  const renderApplicantCard = (a: AppRow, idx: number, showBadge: boolean) => {
    const formData: Record<string, string> = (a.form_data && typeof a.form_data === "object")
      ? a.form_data as Record<string, string>
      : {};
    const docs = docsByAppId[a.id] || [];
    const aPill = STATUS_PILL[a.status] ?? { bg: "var(--bg-card)", color: "var(--muted)", label: a.status };

    return (
      <div key={a.id} className={cardCls} style={cardShadow}>
        {/* Card head */}
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          {showBadge && (
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(155deg, #FF6B4A, #FF512F)" }}
            >
              {idx + 1}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[14px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
              {a.ref}
            </span>
            {a.applicant_name && (
              <p className="mt-[2px] text-[12px] text-muted">{a.applicant_name}</p>
            )}
          </div>
          {/* Group members get their own interactive status selector */}
          {showBadge ? (
            <StatusSelect
              applicationId={a.id}
              status={a.status}
              rejectionReason={a.rejection_reason}
              userId={a.user_id}
              serviceName={a.service_name}
              canEdit={canChangeStatus}
              variant="pill"
            />
          ) : (
            <span
              className="inline-flex items-center gap-[5px] rounded-full px-[10px] py-[4px] text-[11.5px] font-bold"
              style={{ background: aPill.bg, color: aPill.color }}
            >
              {aPill.label}
            </span>
          )}
        </div>

        {/* Form fields — kv grid */}
        <div className="px-[22px] py-[6px]">
          {Object.keys(formData).length === 0 ? (
            <p className="py-[14px] text-[13.5px] text-muted">No form details recorded.</p>
          ) : (
            <dl className="grid gap-x-4" style={{ gridTemplateColumns: "140px 1fr" }}>
              {Object.entries(formData).map(([k, val], i) => (
                <>
                  <dt
                    key={`dt-${k}`}
                    className={`py-[9px] text-[13px] text-muted ${i > 0 ? "border-t border-line-2" : ""}`}
                  >
                    {labelForField(a.form_type, k)}
                  </dt>
                  <dd
                    key={`dd-${k}`}
                    className={`py-[9px] text-right text-[13.5px] font-semibold text-ink ${i > 0 ? "border-t border-line-2" : ""}`}
                    style={{ margin: 0 }}
                  >
                    {val || "—"}
                  </dd>
                </>
              ))}
            </dl>
          )}
        </div>

        {/* Documents — doc-row pattern */}
        {docs.length > 0 && (
          <div className="border-t border-line">
            <div className="flex items-center justify-between px-[22px] py-[18px]">
              <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>Documents</h3>
              <span className="rounded-full bg-bg-card px-[10px] py-[3px] text-[11px] font-semibold text-muted">
                {docs.length} file{docs.length > 1 ? "s" : ""}
              </span>
            </div>
            {docs.map((doc, i) => (
              <div
                key={doc.id}
                className={`flex items-center gap-[13px] px-[16px] py-[13px] ${i < docs.length - 1 ? "border-b border-line-2" : ""}`}
              >
                <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-bg-card text-amer-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <b className="block text-[13.5px] font-semibold text-ink">{doc.name}</b>
                  <span className="text-[12px] text-muted">
                    {doc.size_bytes ? `${Math.round(doc.size_bytes / 1024)} KB · ` : ""}{doc.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {doc.url ? (
                    <>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        title="View"
                        className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-bg-card text-muted transition-colors hover:bg-line-2 hover:text-text"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      </a>
                      <a
                        href={doc.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-8 items-center gap-[6px] rounded-[9px] bg-amer-700 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-amer-600"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download
                      </a>
                    </>
                  ) : (
                    <span className="text-[12px] text-muted-2">Unavailable</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rejection reason banner */}
        {a.status === "rejected" && a.rejection_reason && (
          <div className="flex items-start gap-[10px] border-t border-[#FBD5D0] bg-[#FFF5F3] px-[22px] py-[14px]">
            <div className="mt-[1px] flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-[#FBE9E7]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B53224" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#B53224]">Rejection reason</p>
              <p className="mt-[2px] text-[13px] text-[#B53224]">{a.rejection_reason}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Back link */}
      <Link
        href="/applications"
        className="inline-flex items-center gap-[7px] text-[13.5px] font-semibold text-muted transition-colors hover:text-amer-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back to applications
      </Link>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">
          {/* Detail hero card */}
          <div className={`flex items-center gap-4 p-[22px] ${cardCls}`} style={cardShadow}>
            <div
              className="flex h-[56px] w-[56px] flex-shrink-0 items-center justify-center rounded-[16px] text-white"
              style={{ background: "linear-gradient(155deg, #E24020, #7A1508)" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="text-[22px] font-extrabold text-ink"
                style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em", margin: 0 }}
              >
                {app.service_name}
              </h2>
              <p className="mt-[4px] text-[13px] text-muted">
                #{groupRef || app.ref}
                {app.hub_title ? ` · ${app.hub_title}` : ""}
                {isGroupPrimary ? ` · ${groupApps.length} applicants` : ""}
                {" · submitted "}
                {new Date(app.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <span
              className="inline-flex flex-shrink-0 items-center gap-[5px] rounded-full px-[12px] py-[5px] text-[12px] font-bold"
              style={{ background: pill.bg, color: pill.color }}
            >
              {pill.label}
            </span>
          </div>

          {/* Stepper card */}
          <div className={cardCls} style={cardShadow}>
            <div className="border-b border-line px-[22px] py-[18px]">
              <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>Progress</h3>
            </div>
            <Stepper status={app.status} />
          </div>

          {/* Applicant detail cards */}
          {isGroupPrimary && groupApps.length > 1
            ? groupApps.map((a, idx) => renderApplicantCard(a, idx, true))
            : renderApplicantCard(app as AppRow, 0, false)}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="flex flex-col gap-5">
          {/* Status card */}
          <div className={cardCls} style={cardShadow}>
            <div className="border-b border-line px-[22px] py-[18px]">
              <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>Current status</h3>
            </div>
            <div className="px-[22px] py-[18px]">
              {isGroupPrimary && groupApps.length > 1 ? (
                <div>
                  <span
                    className="inline-flex items-center gap-[6px] rounded-full px-[12px] py-[5px] text-[12.5px] font-bold"
                    style={{ background: pill.bg, color: pill.color }}
                  >
                    {pill.label}
                  </span>
                  <p className="mt-[10px] text-[13px] leading-relaxed text-muted">
                    This is a group application with <b className="font-semibold text-ink">{groupApps.length} applicants</b>. Change each applicant&apos;s status individually using the dropdown in their card above.
                  </p>
                </div>
              ) : (
                <StatusSelect
                  applicationId={app.id}
                  status={app.status}
                  rejectionReason={app.rejection_reason}
                  userId={app.user_id}
                  applicantName={(app as AppRow).applicant_name}
                  serviceName={app.service_name}
                  canEdit={canChangeStatus}
                  variant="block"
                />
              )}
            </div>
          </div>

          {/* Fee card */}
          <div className={cardCls} style={cardShadow}>
            <div className="border-b border-line px-[22px] py-[18px]">
              <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>Fee</h3>
            </div>
            <div className="px-[22px] py-[18px]">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="text-[28px] font-extrabold text-ink"
                  style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
                >
                  {app.fee != null
                    ? isGroupPrimary && groupApps.length > 1
                      ? `AED ${(app.fee * groupApps.length).toFixed(2)}`
                      : `AED ${app.fee}`
                    : "—"}
                </span>
                {isGroupPrimary && groupApps.length > 1 && app.fee != null && (
                  <span className="rounded-full bg-bg-card px-[10px] py-[3px] text-[11px] font-semibold text-muted">
                    AED {app.fee} × {groupApps.length}
                  </span>
                )}
              </div>
              <dl className="mt-[14px] grid gap-x-4" style={{ gridTemplateColumns: "90px 1fr" }}>
                {[
                  ["Ref",      groupRef || app.ref],
                  ["Location", app.location || "—"],
                  ["Submitted", new Date(app.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
                ].map(([label, val], i) => (
                  <>
                    <dt
                      key={`fdt-${label}`}
                      className={`py-[8px] text-[12.5px] text-muted ${i > 0 ? "border-t border-line-2" : ""}`}
                    >
                      {label}
                    </dt>
                    <dd
                      key={`fdd-${label}`}
                      className={`py-[8px] text-right text-[12.5px] font-semibold text-ink capitalize ${i > 0 ? "border-t border-line-2" : ""}`}
                      style={{ margin: 0 }}
                    >
                      {val}
                    </dd>
                  </>
                ))}
              </dl>
            </div>
          </div>

          {/* Account holder card */}
          <div className={cardCls} style={cardShadow}>
            <div className="border-b border-line px-[22px] py-[18px]">
              <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>Account holder</h3>
            </div>
            <div className="flex items-center gap-3 border-b border-line-2 px-[22px] py-[18px]">
              <div
                className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[12px] text-[15px] font-black"
                style={{ background: "linear-gradient(155deg, #E3C77E, #A6822F)", color: "#2A1F00" }}
              >
                {(profile?.full_name || profile?.email || "?")
                  .split(" ").filter(Boolean).slice(0, 2)
                  .map((w: string) => w[0].toUpperCase()).join("")}
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink truncate">{profile?.full_name || "—"}</p>
                {profile?.email && (
                  <p className="text-[11.5px] text-muted-2 truncate">{profile.email}</p>
                )}
              </div>
            </div>
            <dl className="grid gap-x-4 px-[22px] py-[6px]" style={{ gridTemplateColumns: "90px 1fr" }}>
              {[
                ["Mobile",      profile?.mobile      || "—"],
                ["Nationality", profile?.nationality || "—"],
              ].map(([label, val], i) => (
                <>
                  <dt
                    key={`adt-${label}`}
                    className={`py-[9px] text-[12.5px] text-muted ${i > 0 ? "border-t border-line-2" : ""}`}
                  >
                    {label}
                  </dt>
                  <dd
                    key={`add-${label}`}
                    className={`py-[9px] text-right text-[12.5px] font-semibold text-ink ${i > 0 ? "border-t border-line-2" : ""}`}
                    style={{ margin: 0 }}
                  >
                    {val}
                  </dd>
                </>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
