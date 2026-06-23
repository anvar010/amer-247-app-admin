"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS = ["submitted", "in_review", "scheduled", "approved", "rejected"] as const;
const STATUS_STEP: Record<string, number> = {
  submitted: 0, in_review: 1, scheduled: 2, approved: 3, rejected: 3,
};
const STATUS_BADGE_CLASS: Record<string, string> = {
  submitted:  "border-line bg-surface text-muted",
  in_review:  "border-blue-200 bg-blue-50 text-blue-600",
  scheduled:  "border-amber-200 bg-amber-50 text-amber-600",
  approved:   "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected:   "border-red-200 bg-red-50 text-red-600",
};

export function ApplicantStatusSelect({
  applicationId,
  applicantIndex,
  currentStatuses,
  userId,
  applicantName,
  serviceName,
  canEdit = true,
}: {
  applicationId: string;
  applicantIndex: number;
  currentStatuses: Array<{ status: string; rejection_reason?: string | null }>;
  userId: string;
  applicantName: string;
  serviceName: string;
  canEdit?: boolean;
}) {
  const current = currentStatuses[applicantIndex] ?? { status: "submitted", rejection_reason: null };

  if (!canEdit) {
    return (
      <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${STATUS_BADGE_CLASS[current.status] ?? STATUS_BADGE_CLASS.submitted}`}>
        {current.status.replace("_", " ")}
      </span>
    );
  }

  const router = useRouter();
  const [value, setValue] = useState(current.status);
  const [saving, setSaving] = useState(false);
  const [pendingReject, setPendingReject] = useState(false);
  const [note, setNote] = useState(current.rejection_reason || "");

  const save = async (newStatus: string, reason?: string) => {
    setSaving(true);
    const supabase = createClient();

    // Build updated statuses array — keep existing, patch this index
    const updated = [...currentStatuses];
    updated[applicantIndex] = {
      status: newStatus,
      rejection_reason: newStatus === "rejected" ? (reason ?? null) : null,
    };

    // Also sync top-level status to the "worst" / most recent change
    const overallStatus = updated.some((a) => a.status === "rejected")
      ? "rejected"
      : updated.every((a) => a.status === "approved")
        ? "approved"
        : updated.find((a) => a.status !== "submitted")?.status ?? "submitted";

    await supabase.from("applications").update({
      applicant_statuses: updated,
      status: overallStatus,
      current_step: STATUS_STEP[overallStatus] ?? 0,
    }).eq("id", applicationId);

    // Push notification for this applicant's status change
    const statusLabel = newStatus.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const notifBody = newStatus === "rejected"
      ? `${applicantName}'s ${serviceName} application was not approved.`
      : `${applicantName}'s ${serviceName} application is now ${statusLabel}.`;
    await supabase.functions.invoke("send-push", {
      body: { user_id: userId, title: "Application Update", body: notifBody },
    });

    setSaving(false);
    router.refresh();
  };

  const onChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setValue(next);
    if (next === "rejected") { setPendingReject(true); }
    else { setPendingReject(false); await save(next); }
  };

  const confirmReject = async () => { await save("rejected", note.trim() || undefined); setPendingReject(false); };
  const cancelReject = () => { setValue(current.status); setPendingReject(false); setNote(current.rejection_reason || ""); };

  return (
    <div className="flex flex-col items-end gap-2">
      <select value={value} onChange={onChange} disabled={saving}
        className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink outline-none disabled:opacity-50">
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt.replace("_", " ")}</option>
        ))}
      </select>
      {pendingReject && (
        <div className="flex w-72 flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-semibold text-red-700">Rejection reason for this applicant</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Enter reason shown to the applicant…" rows={3}
            className="w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-ink outline-none placeholder:text-muted focus:border-red-400" />
          <div className="flex gap-2">
            <button onClick={confirmReject} disabled={saving}
              className="flex-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {saving ? "Saving…" : "Confirm rejection"}
            </button>
            <button onClick={cancelReject}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
