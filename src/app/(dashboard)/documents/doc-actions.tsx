"use client";

import { useState } from "react";
import { updateDocStatus } from "../users/[id]/actions";

export function DocActions({
  docId,
  userId,
  status,
  rejectionReason,
}: {
  docId: string;
  userId: string;
  status: string;
  rejectionReason: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(rejectionReason || "");

  const verify = async () => {
    setBusy(true);
    await updateDocStatus(docId, "verified", null, userId);
    setBusy(false);
  };

  const confirmReject = async () => {
    setBusy(true);
    await updateDocStatus(docId, "rejected", reason.trim() || null, userId);
    setBusy(false);
    setRejecting(false);
  };

  return (
    <>
      {/* Verify button */}
      <button
        onClick={verify}
        disabled={busy || status === "verified"}
        title="Verify"
        className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-bg-card text-muted transition-colors hover:bg-[rgba(27,163,156,0.13)] hover:text-[#0D6B66] disabled:opacity-40 disabled:pointer-events-none"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>

      {/* Reject button */}
      <button
        onClick={() => setRejecting(true)}
        disabled={busy}
        title="Reject"
        className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-bg-card text-muted transition-colors hover:bg-[#FBE9E7] hover:text-[#B53224] disabled:opacity-40"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Reject modal */}
      {rejecting && (
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
                  Reject document?
                </h3>
                <p className="mt-[3px] text-[13.5px] text-muted">
                  The applicant will be asked to re-upload with the reason below.
                </p>
              </div>
            </div>

            <div className="px-[22px] py-[18px]">
              <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">Rejection reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
                placeholder="e.g. Document unreadable / poor quality"
                rows={3}
                className="w-full resize-none rounded-[13px] border-[1.5px] border-line bg-surface px-[14px] py-[12px] text-[14px] text-ink placeholder:text-muted-2 outline-none"
                onFocus={(e)  => { e.target.style.borderColor = "#FF9669"; e.target.style.boxShadow = "0 0 0 4px rgba(255,81,47,0.1)"; }}
                onBlur={(e)   => { e.target.style.borderColor = ""; e.target.style.boxShadow = ""; }}
              />
            </div>

            <div className="flex justify-end gap-[10px] px-[22px] pb-[22px]">
              <button
                onClick={() => setRejecting(false)}
                className="flex h-[38px] items-center rounded-[11px] border-[1.5px] border-line bg-surface px-[14px] text-[13px] font-semibold text-ink transition-colors hover:border-muted-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={busy}
                className="flex h-[38px] items-center gap-2 rounded-[11px] bg-[#C0392B] px-[14px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {busy ? "Saving…" : "Confirm reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
