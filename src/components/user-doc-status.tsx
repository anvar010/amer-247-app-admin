"use client";

import { useState } from "react";
import { updateDocStatus } from "@/app/(dashboard)/users/[id]/actions";

const STATUS_OPTIONS = ["pending", "in_review", "approved", "rejected"] as const;
type DocStatus = typeof STATUS_OPTIONS[number];

export function UserDocStatus({
  docId,
  status,
  rejectionReason,
  userId,
}: {
  docId: string;
  status: DocStatus;
  rejectionReason?: string | null;
  userId: string;
}) {
  const [value, setValue] = useState<DocStatus>(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingReject, setPendingReject] = useState(false);
  const [editingReason, setEditingReason] = useState(false);
  const [note, setNote] = useState(rejectionReason || "");

  const save = async (newStatus: DocStatus, reason?: string) => {
    setSaving(true);
    setError(null);
    const result = await updateDocStatus(docId, newStatus, reason ?? null, userId);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      setValue(status); // revert on error
    }
  };

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as DocStatus;
    setValue(next);
    if (next === "rejected") {
      setPendingReject(true);
    } else {
      setPendingReject(false);
      await save(next);
    }
  };

  const confirmReject = async () => {
    await save("rejected", note.trim() || undefined);
    setPendingReject(false);
  };

  const cancelReject = () => {
    setValue(status);
    setPendingReject(false);
    setNote(rejectionReason || "");
  };

  const confirmEditReason = async () => {
    await save("rejected", note.trim() || undefined);
    setEditingReason(false);
  };

  const cancelEditReason = () => {
    setNote(rejectionReason || "");
    setEditingReason(false);
  };

  const statusColor: Record<DocStatus, string> = {
    pending:   "text-amber-600 bg-amber-50 border-amber-200",
    in_review: "text-blue-600 bg-blue-50 border-blue-200",
    approved:  "text-emerald-700 bg-emerald-50 border-emerald-200",
    rejected:  "text-red-600 bg-red-50 border-red-200",
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        value={value}
        onChange={onChange}
        disabled={saving}
        className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none disabled:opacity-50 ${statusColor[value]}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt.replace("_", " ")}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {pendingReject && (
        <div className="flex w-64 flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-700">Rejection reason</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason shown to the user…"
            rows={2}
            className="w-full resize-none rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs text-ink outline-none placeholder:text-muted focus:border-red-400"
          />
          <div className="flex gap-1.5">
            <button onClick={confirmReject} disabled={saving}
              className="flex-1 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {saving ? "Saving…" : "Confirm"}
            </button>
            <button onClick={cancelReject}
              className="rounded-full border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-surface">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!pendingReject && value === "rejected" && !editingReason && (
        <button onClick={() => setEditingReason(true)}
          className="w-fit rounded-full border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
          Edit reason
        </button>
      )}

      {editingReason && (
        <div className="flex w-64 flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-700">Edit rejection reason</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason shown to the user…"
            rows={2}
            className="w-full resize-none rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs text-ink outline-none placeholder:text-muted focus:border-red-400"
          />
          <div className="flex gap-1.5">
            <button onClick={confirmEditReason} disabled={saving}
              className="flex-1 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={cancelEditReason}
              className="rounded-full border border-line px-2 py-1 text-xs font-semibold text-ink hover:bg-surface">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
