"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS = ["submitted", "in_review", "scheduled", "approved", "rejected"] as const;
const STATUS_STEP: Record<string, number> = {
  submitted: 0, in_review: 1, scheduled: 2, approved: 3, rejected: 3,
};

const STATUS_PILL: Record<string, string> = {
  submitted: "bg-[#EAF0FA] text-[#2A5B9E]",
  in_review: "bg-primary-bg text-amer-600",
  scheduled: "bg-[#E7F4F3] text-[#0D6B66]",
  approved:  "bg-success-bg text-success-fg",
  rejected:  "bg-[#FBE9E7] text-[#B53224]",
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  scheduled: "Scheduled",
  approved:  "Approved",
  rejected:  "Rejected",
};

const STATUS_DESC: Record<string, string> = {
  submitted: "Received from applicant, awaiting triage.",
  in_review: "An officer is reviewing the application & documents.",
  scheduled: "A branch visit or medical fitness test has been booked.",
  approved:  "Application approved — ready for issuance / pickup.",
  rejected:  "Application declined. Reason recorded in the log.",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  submitted: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  in_review: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  scheduled: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  approved:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/><polyline points="9 12 11 14 15 10"/></svg>,
  rejected:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ─── Refund sub-status ────────────────────────────────────────────────────────
const REFUND_OPTIONS = ["pending", "processing", "refunded"] as const;
type RefundStatus = typeof REFUND_OPTIONS[number];

const REFUND_PILL: Record<RefundStatus, string> = {
  pending:    "bg-[#FFF8E7] text-[#A6822F]",
  processing: "bg-primary-bg text-amer-600",
  refunded:   "bg-[#E7F4F3] text-[#0D6B66]",
};
const REFUND_LABEL: Record<RefundStatus, string> = {
  pending:    "Pending",
  processing: "Processing",
  refunded:   "Refunded",
};
const REFUND_ICON: Record<RefundStatus, React.ReactNode> = {
  pending:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  processing: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>,
  refunded:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z"/><polyline points="9 12 11 14 15 10"/></svg>,
};

import React, { useRef, useEffect } from "react";

export function StatusSelect(props: {
  applicationId: string;
  status: string;
  refundStatus?: string | null;
  rejectionReason?: string | null;
  userId?: string;
  applicantName?: string | null;
  serviceName?: string;
  canEdit?: boolean;
  variant?: "pill" | "block";
}) {
  const { applicationId, status, refundStatus: initialRefundStatus, rejectionReason, canEdit = true, variant = "pill" } = props;

  // All hooks must come before any conditional returns
  const router = useRouter();
  const [value, setValue]                = useState(status);
  const [saving, setSaving]              = useState(false);
  const [pendingReject, setPendingReject] = useState(false);
  const [note, setNote]                  = useState(rejectionReason || "");
  const [category, setCategory]          = useState<string>("other");
  const [userDocs, setUserDocs]          = useState<{ name: string; file_path: string }[]>([]);
  const [selectedDocs, setSelectedDocs]  = useState<string[]>([]);
  const [open, setOpen]                  = useState(false);
  const [pending, setPending]            = useState<string | null>(null);
  const [dropPos, setDropPos]            = useState<{ top: number; right: number } | null>(null);
  const pillBtnRef                       = useRef<HTMLButtonElement>(null);
  const [refundStatus, setRefundStatus]  = useState<RefundStatus | null>((initialRefundStatus as RefundStatus) || null);
  const [refundOpen, setRefundOpen]      = useState(false);
  const [savingRefund, setSavingRefund]  = useState(false);

  const pillCls   = STATUS_PILL[status] ?? "bg-bg-card text-muted";
  const pillLabel = STATUS_LABEL[status] ?? status.replace("_", " ");

  useEffect(() => {
    if (category !== "document_issue") return;
    const supabase = createClient();
    supabase
      .from("application_documents")
      .select("name, file_path")
      .eq("application_id", applicationId)
      .then(({ data }) => setUserDocs(data || []));
  }, [category, applicationId]);

  if (!canEdit) {
    return (
      <span className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11.5px] font-bold ${pillCls}`}>
        {STATUS_ICON[status]}
        {pillLabel}
      </span>
    );
  }

  const [saveError, setSaveError] = useState<string | null>(null);

  const save = async (newStatus: string, reason?: string, cat?: string, docTypes?: string[]) => {
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("applications")
        .update({
          status: newStatus,
          current_step: STATUS_STEP[newStatus] ?? 0,
          rejection_reason:    newStatus === "rejected" ? (reason ?? null) : null,
          rejection_category:  newStatus === "rejected" ? (cat ?? "other") : null,
          rejected_doc_types:  newStatus === "rejected" && cat === "document_issue" ? (docTypes ?? []) : [],
        })
        .eq("id", applicationId);
      if (error) {
        setSaveError(error.message);
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const pick = async (next: string) => {
    if (variant === "block") {
      setPending(next);
      if (next !== "rejected") {
        setValue(next);
        setOpen(false);
        await save(next);
        setPending(null);
      }
    } else {
      setOpen(false);
      setValue(next);
      if (next === "rejected") {
        setPendingReject(true);
      } else {
        setPendingReject(false);
        await save(next);
      }
    }
  };

  const CATEGORY_LABEL: Record<string, string> = {
    document_issue:     "Document issue",
    incomplete_details: "Incomplete details",
    eligibility:        "Eligibility",
    other:              "Other",
  };

  const confirmReject = async () => {
    setValue("rejected");
    const reason = note.trim() || (
      category === "document_issue" && selectedDocs.length > 0
        ? `Document issue: ${selectedDocs.join(", ")}`
        : CATEGORY_LABEL[category] || "Other"
    );
    await save("rejected", reason, category, selectedDocs);
    setPendingReject(false);
    setPending(null);
    setOpen(false);
  };

  const cancelReject = () => {
    setValue(status);
    setPendingReject(false);
    setPending(null);
    setNote(rejectionReason || "");
    setCategory("other");
    setSelectedDocs([]);
  };

  const [pendingRefundSel, setPendingRefundSel] = useState<RefundStatus | null>(null);

  const confirmRefund = async () => {
    if (!pendingRefundSel) return;
    setSavingRefund(true);
    const next = pendingRefundSel;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("applications").update({ refund_status: next }).eq("id", applicationId);
      if (error) { setSaveError(error.message); return; }
      setRefundStatus(next);
      setPendingRefundSel(null);
      setRefundOpen(false);
      router.refresh();
    } finally {
      setSavingRefund(false);
    }
  };

  const cancelRefund = () => { setPendingRefundSel(null); setRefundOpen(false); };

  const toggleDoc = (docType: string) =>
    setSelectedDocs((prev) =>
      prev.includes(docType) ? prev.filter((d) => d !== docType) : [...prev, docType]
    );

  const DocCheckboxes = () =>
    userDocs.length > 0 ? (
      <div>
        <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">
          Flag specific documents <span className="font-normal text-muted">(optional)</span>
        </label>
        <div className="flex flex-col gap-[6px]">
          {userDocs.map((d) => {
            const checked = selectedDocs.includes(d.name);
            return (
              <button
                key={d.name}
                type="button"
                onClick={() => toggleDoc(d.name)}
                className={`flex items-center gap-[10px] rounded-[10px] border-[1.5px] px-[12px] py-[9px] text-left transition-colors ${
                  checked ? "border-[#C0392B] bg-[#FBE9E7]" : "border-line bg-surface hover:border-muted-2"
                }`}
              >
                <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[4px] border-[1.5px] ${checked ? "border-[#C0392B] bg-[#C0392B]" : "border-muted-2"}`}>
                  {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{d.name}</p>
                  <p className="text-[11px] text-muted">{d.file_path.split("/").pop()}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  const currentPill = STATUS_PILL[value] ?? "bg-bg-card text-muted";
  const currentLabel = STATUS_LABEL[value] ?? value.replace("_", " ");
  const currentDesc  = STATUS_DESC[value] ?? "";

  /* ─── BLOCK VARIANT (sidebar card) ─── */
  if (variant === "block") {
    return (
      <div>
        {/* Status pill */}
        <span className={`inline-flex items-center gap-[6px] rounded-full px-[12px] py-[5px] text-[12.5px] font-bold ${currentPill}`}>
          {STATUS_ICON[value]}
          {currentLabel}
        </span>

        {/* Description */}
        {value === "rejected" && rejectionReason ? (
          <div className="mt-[10px] rounded-[11px] bg-[#FBE9E7] px-[14px] py-[10px]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B53224] mb-[4px]">Rejection reason</p>
            <p className="text-[13.5px] leading-relaxed text-[#B53224]">{rejectionReason}</p>
          </div>
        ) : (
          <p className="mt-[10px] text-[13.5px] leading-relaxed text-muted">
            {currentDesc}
          </p>
        )}

        {/* Refund sub-status — shown only when rejected */}
        {value === "rejected" && (
          <div className="mt-[12px] mb-[16px] rounded-[12px] border border-line bg-bg-card px-[14px] py-[12px]">
            <div className="flex items-center justify-between mb-[8px]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Refund Status</p>
              {refundStatus && (
                <span className={`inline-flex items-center gap-[5px] rounded-full px-[8px] py-[3px] text-[11px] font-bold ${REFUND_PILL[refundStatus]}`}>
                  {REFUND_ICON[refundStatus]}
                  {REFUND_LABEL[refundStatus]}
                </span>
              )}
            </div>
            {refundOpen ? (
              <div className="flex flex-col gap-[6px]">
                {REFUND_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPendingRefundSel(opt)}
                    className={`flex items-center gap-[8px] rounded-[9px] border-[1.5px] px-[10px] py-[8px] text-left text-[12.5px] font-semibold transition-colors ${
                      (pendingRefundSel ?? refundStatus) === opt
                        ? "border-amer-700 bg-primary-bg text-amer-600"
                        : "border-line bg-surface text-ink hover:border-muted-2"
                    }`}
                  >
                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${REFUND_PILL[opt]}`}>
                      {REFUND_ICON[opt]}
                    </span>
                    {REFUND_LABEL[opt]}
                    {refundStatus === opt && !pendingRefundSel && (
                      <span className="ml-auto text-[10px] text-muted">saved</span>
                    )}
                  </button>
                ))}
                <div className="flex gap-2 pt-[2px]">
                  <button
                    onClick={cancelRefund}
                    className="flex h-[34px] flex-1 items-center justify-center rounded-[9px] border-[1.5px] border-line bg-surface text-[12.5px] font-semibold text-ink transition-colors hover:border-muted-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRefund}
                    disabled={savingRefund || !pendingRefundSel || pendingRefundSel === refundStatus}
                    className="flex h-[34px] flex-1 items-center justify-center gap-[5px] rounded-[9px] bg-amer-700 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {savingRefund ? "Saving…" : "Update"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setPendingRefundSel(refundStatus); setRefundOpen(true); }}
                disabled={savingRefund}
                className="flex w-full items-center justify-center gap-[6px] rounded-[9px] border-[1.5px] border-line bg-surface px-[10px] py-[8px] text-[12.5px] font-semibold text-ink transition-colors hover:border-muted-2 disabled:opacity-50"
              >
                {savingRefund ? "Saving…" : refundStatus ? "Update refund status" : "Set refund status"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            )}
          </div>
        )}

        {saveError && (
          <p className="mb-2 rounded-[10px] bg-[#FBE9E7] px-3 py-2 text-[12px] font-medium text-[#B53224]">
            Save failed: {saveError}
          </p>
        )}

        {/* Change status button */}
        {!open ? (
          <button
            disabled={saving}
            onClick={() => { setSaveError(null); setOpen(true); }}
            className="flex w-full items-center justify-center gap-2 rounded-[13px] py-[13px] text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #FF6B4A, #E24020)", boxShadow: "var(--shadow-primary)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
            {saving ? "Saving…" : "Change status"}
          </button>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {/* Status option grid */}
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const cls = STATUS_PILL[opt] ?? "bg-bg-card text-muted";
                const lbl = STATUS_LABEL[opt];
                const isOn = pending === opt || (!pending && value === opt);
                return (
                  <button
                    key={opt}
                    onClick={() => pick(opt)}
                    disabled={saving && pending === opt}
                    className={`flex items-center gap-[8px] rounded-[11px] border-[1.5px] px-[10px] py-[9px] text-left text-[12.5px] font-semibold transition-colors ${
                      isOn
                        ? "border-amer-700 bg-primary-bg text-amer-600"
                        : "border-line bg-surface text-text hover:border-muted-2"
                    }`}
                  >
                    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[6px] text-[11px] ${isOn ? "" : cls}`}>
                      {STATUS_ICON[opt]}
                    </span>
                    {lbl}
                  </button>
                );
              })}
            </div>

            {/* Rejection fields (shown when rejected is picked) */}
            {pending === "rejected" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "document_issue",    label: "📄 Document issue" },
                    { value: "incomplete_details", label: "✏️ Incomplete" },
                    { value: "eligibility",        label: "🚫 Eligibility" },
                    { value: "other",              label: "💬 Other" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCategory(opt.value)}
                      className={`rounded-[9px] border-[1.5px] px-[8px] py-[7px] text-[11.5px] font-semibold transition-colors ${
                        category === opt.value
                          ? "border-[#C0392B] bg-[#FBE9E7] text-[#B53224]"
                          : "border-line bg-surface text-muted hover:border-muted-2"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {category === "document_issue" && <DocCheckboxes />}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  autoFocus
                  placeholder="Add a rejection reason for the applicant…"
                  rows={3}
                  className="w-full resize-none rounded-[11px] border-[1.5px] border-line bg-surface px-[12px] py-[10px] text-[13px] text-ink placeholder:text-muted-2 outline-none"
                  onFocus={(e) => { e.target.style.borderColor = "#FF9669"; e.target.style.boxShadow = "0 0 0 4px rgba(255,81,47,0.1)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                />
              </>
            )}

            {/* Footer buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); setPending(null); setNote(rejectionReason || ""); }}
                className="flex h-[38px] flex-1 items-center justify-center rounded-[11px] border-[1.5px] border-line bg-surface text-[13px] font-semibold text-ink transition-colors hover:border-muted-2"
              >
                Cancel
              </button>
              {pending === "rejected" && (
                <button
                  onClick={confirmReject}
                  disabled={saving}
                  className="flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-[11px] bg-[#C0392B] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Confirm"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── PILL VARIANT (table / card header) ─── */
  return (
    <div className="flex flex-col items-end gap-[6px]">
      <div>
        <button
          ref={pillBtnRef}
          disabled={saving}
          onClick={() => {
            const rect = pillBtnRef.current?.getBoundingClientRect();
            if (rect) setDropPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
            setOpen((o) => !o);
          }}
          className={`inline-flex items-center gap-[6px] rounded-full px-[10px] py-[4px] text-[11.5px] font-bold transition-opacity disabled:opacity-50 ${currentPill}`}
        >
          {STATUS_ICON[value]}
          {currentLabel}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {open && dropPos && (
          <>
            <div className="fixed inset-0 z-[40]" onClick={() => setOpen(false)} />
            <div
              className="fixed z-[50] min-w-[160px] overflow-hidden rounded-[14px] border border-line bg-surface"
              style={{ top: dropPos.top, right: dropPos.right, boxShadow: "var(--shadow-lg)" }}
            >
              {STATUS_OPTIONS.map((opt) => {
                const cls = STATUS_PILL[opt] ?? "bg-bg-card text-muted";
                const lbl = STATUS_LABEL[opt];
                return (
                  <button
                    key={opt}
                    onClick={() => pick(opt)}
                    className="flex w-full items-center gap-2.5 px-[14px] py-[10px] text-left text-[13px] font-medium text-ink transition-colors hover:bg-bg-card"
                  >
                    <span className={`inline-flex items-center gap-[5px] rounded-full px-2 py-[2px] text-[11px] font-bold ${cls}`}>
                      {STATUS_ICON[opt]}{lbl}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {pendingReject && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-6"
          style={{ background: "rgba(26,10,5,0.5)", backdropFilter: "blur(3px)" }}
        >
          <div
            className="w-full max-w-[460px] overflow-hidden bg-surface"
            style={{ borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-start gap-3 px-[22px] pt-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-[#FBE9E7] text-[#B53224]">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </span>
              <div>
                <h3 className="text-[19px] font-extrabold text-ink" style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}>
                  Reject application?
                </h3>
                <p className="mt-[3px] text-[13.5px] text-muted">Tell the applicant what needs fixing.</p>
              </div>
            </div>
            <div className="px-[22px] py-[18px] flex flex-col gap-[14px]">
              <div>
                <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">Rejection category</label>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "document_issue",    label: "📄 Document issue",     desc: "Missing or invalid doc" },
                    { value: "incomplete_details", label: "✏️ Incomplete details", desc: "Form info missing" },
                    { value: "eligibility",        label: "🚫 Eligibility",        desc: "Doesn't qualify" },
                    { value: "other",              label: "💬 Other",              desc: "See reason below" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCategory(opt.value)}
                      className={`flex flex-col items-start rounded-[11px] border-[1.5px] px-[10px] py-[9px] text-left transition-colors ${
                        category === opt.value
                          ? "border-[#C0392B] bg-[#FBE9E7]"
                          : "border-line bg-surface hover:border-muted-2"
                      }`}
                    >
                      <span className="text-[12.5px] font-semibold text-ink">{opt.label}</span>
                      <span className="text-[11px] text-muted">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              {category === "document_issue" && <DocCheckboxes />}
              <div>
                <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">Reason <span className="font-normal text-muted">(shown to applicant)</span></label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write the reason the applicant will see…"
                  rows={3}
                  className="w-full resize-none rounded-[13px] border-[1.5px] border-line bg-surface px-[14px] py-[12px] text-[14px] text-ink placeholder:text-muted-2 outline-none transition-shadow"
                  onFocus={(e) => { e.target.style.borderColor = "#FF9669"; e.target.style.boxShadow = "0 0 0 4px rgba(255,81,47,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-[10px] px-[22px] pb-[22px]">
              <button onClick={cancelReject} className="flex h-[38px] items-center rounded-[11px] border-[1.5px] border-line bg-surface px-[14px] text-[13px] font-semibold text-ink transition-colors hover:border-muted-2">
                Cancel
              </button>
              <button onClick={confirmReject} disabled={saving} className="flex h-[38px] items-center gap-2 rounded-[11px] bg-[#C0392B] px-[14px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {saving ? "Saving…" : "Confirm rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Standalone refund status editor (for group applicant cards) ──────────────
export function RefundStatusSelect({ applicationId, refundStatus: initial }: { applicationId: string; refundStatus?: string | null }) {
  const router = useRouter();
  const [refundStatus, setRefundStatus] = useState<RefundStatus | null>((initial as RefundStatus) || null);
  const [selected, setSelected]         = useState<RefundStatus | null>((initial as RefundStatus) || null);
  const [open, setOpen]                 = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const confirmUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.from("applications").update({ refund_status: selected }).eq("id", applicationId);
      if (err) { setError(err.message); return; }
      setRefundStatus(selected);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => { setSelected(refundStatus); setOpen(false); };

  return (
    <div className="border-t border-[#F5E6E6] bg-[#FFFBFB] px-[22px] py-[12px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B53224" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
          </svg>
          <span className="text-[12px] font-semibold text-[#B53224]">Refund Status</span>
        </div>
        {refundStatus && !open && (
          <span className={`inline-flex items-center gap-[5px] rounded-full px-[8px] py-[3px] text-[11px] font-bold ${REFUND_PILL[refundStatus]}`}>
            {REFUND_ICON[refundStatus]}
            {REFUND_LABEL[refundStatus]}
          </span>
        )}
      </div>

      {open ? (
        <div className="mt-[10px] flex flex-col gap-[6px]">
          {REFUND_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelected(opt)}
              className={`flex items-center gap-[8px] rounded-[9px] border-[1.5px] px-[10px] py-[7px] text-left text-[12.5px] font-semibold transition-colors ${
                selected === opt
                  ? "border-amer-700 bg-primary-bg text-amer-600"
                  : "border-line bg-surface text-ink hover:border-muted-2"
              }`}
            >
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${REFUND_PILL[opt]}`}>
                {REFUND_ICON[opt]}
              </span>
              {REFUND_LABEL[opt]}
              {refundStatus === opt && <span className="ml-auto text-[10px] text-muted">saved</span>}
            </button>
          ))}
          {error && (
            <p className="rounded-[8px] bg-[#FBE9E7] px-3 py-2 text-[11.5px] font-medium text-[#B53224]">
              Save failed: {error}
            </p>
          )}
          <div className="flex gap-2 pt-[2px]">
            <button
              onClick={cancel}
              className="flex h-[34px] flex-1 items-center justify-center rounded-[9px] border-[1.5px] border-line bg-surface text-[12.5px] font-semibold text-ink transition-colors hover:border-muted-2"
            >
              Cancel
            </button>
            <button
              onClick={confirmUpdate}
              disabled={saving || !selected || selected === refundStatus}
              className="flex h-[34px] flex-1 items-center justify-center gap-[5px] rounded-[9px] bg-amer-700 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Update"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          disabled={saving}
          className="mt-[8px] flex w-full items-center justify-center gap-[6px] rounded-[9px] border-[1.5px] border-line bg-surface px-[10px] py-[7px] text-[12px] font-semibold text-ink transition-colors hover:border-muted-2 disabled:opacity-50"
        >
          {refundStatus ? "Update refund status" : "Set refund status"}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      )}
    </div>
  );
}
