"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type StaffMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  staff_status: string | null;
};

function ini(s: string) {
  return s.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function StatusBadge({ status }: { status: string | null }) {
  const free = !status || status === "free";
  return (
    <span
      className="inline-flex items-center gap-[4px] rounded-full px-[7px] py-[2px] text-[10.5px] font-bold"
      style={{
        background: free ? "#E7F4F3" : "rgba(255,81,47,0.12)",
        color: free ? "#0D6B66" : "#E24020",
      }}
    >
      <span
        className="inline-block h-[5px] w-[5px] rounded-full"
        style={{ background: free ? "#0D6B66" : "#E24020" }}
      />
      {free ? "Free" : "Engaged"}
    </span>
  );
}

export function AssignOfficerPanel({
  applicationId,
  assignedTo,
  assignedProfile,
  assignmentStatus,
  staff,
  isSuperAdmin,
  currentUserId,
  applicationRef,
  serviceName,
}: {
  applicationId: string;
  assignedTo: string | null;
  assignedProfile: StaffMember | null;
  assignmentStatus: string | null;
  staff: StaffMember[];
  isSuperAdmin: boolean;
  currentUserId: string;
  applicationRef: string;
  serviceName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = assignedTo
    ? (staff.find((s) => s.id === assignedTo) ?? assignedProfile)
    : null;

  const assign = async (staffId: string) => {
    if (saving) return;
    setSaving(true);
    try {
      const target = staff.find((s) => s.id === staffId);
      const queued = target?.staff_status === "engaged";
      const supabase = createClient();
      await supabase
        .from("applications")
        .update({ assigned_to: staffId, assignment_status: queued ? "queued" : "assigned" })
        .eq("id", applicationId);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const unassign = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("applications")
        .update({ assigned_to: null, assignment_status: null })
        .eq("id", applicationId);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {current ? (
        <div>
          <div className="flex items-center gap-[10px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-bg-card text-[13px] font-bold text-amer-700">
              {ini(current.full_name || current.email || "?")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-ink">
                {current.full_name || current.email || "Unknown"}
              </p>
              <div className="mt-[2px] flex flex-wrap items-center gap-[5px]">
                {assignmentStatus === "done" ? (
                  <span className="inline-flex items-center gap-[5px] rounded-full bg-[#E7F4F3] px-[8px] py-[2px] text-[10.5px] font-bold text-[#0D6B66]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Work done
                  </span>
                ) : (
                  <>
                    <StatusBadge status={current.staff_status} />
                    {assignmentStatus === "queued" && (
                      <span className="inline-flex items-center rounded-full bg-[#FFF8E7] px-[7px] py-[2px] text-[10.5px] font-bold text-[#A6822F]">
                        Queued
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {isSuperAdmin && !open && (
            <div className="mt-[10px] flex gap-[6px]">
              <button
                onClick={() => setOpen(true)}
                className="flex h-[30px] flex-1 items-center justify-center rounded-[9px] border border-line bg-surface text-[12px] font-semibold text-ink transition-colors hover:border-muted-2"
              >
                Reassign
              </button>
              <button
                onClick={unassign}
                disabled={saving}
                className="flex h-[30px] items-center justify-center rounded-[9px] border border-[#FBD5D0] bg-[#FFF5F3] px-[10px] text-[12px] font-semibold text-[#B53224] transition-colors hover:border-[#C0392B] disabled:opacity-50"
              >
                {saving ? "…" : "Remove"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-[13px] text-muted">Not assigned to anyone yet.</p>
          {isSuperAdmin && !open && (
            <button
              onClick={() => setOpen(true)}
              className="mt-[10px] flex w-full items-center justify-center gap-[7px] rounded-[11px] border-[1.5px] border-dashed border-amer-700 py-[9px] text-[13px] font-semibold text-amer-700 transition-opacity hover:opacity-70"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Assign officer
            </button>
          )}
        </div>
      )}

      {open && isSuperAdmin && (
        <div className="mt-[10px] flex flex-col gap-[6px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted-2">
            Select officer
          </p>
          {staff.map((s) => (
            <button
              key={s.id}
              onClick={() => assign(s.id)}
              disabled={saving}
              className={`flex items-center gap-[10px] rounded-[10px] border-[1.5px] px-[10px] py-[9px] text-left transition-colors ${
                assignedTo === s.id
                  ? "border-amer-700 bg-primary-bg"
                  : "border-line bg-surface hover:border-muted-2"
              }`}
            >
              <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] bg-bg-card text-[12px] font-bold text-amer-700">
                {ini(s.full_name || s.email || "?")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-ink">
                  {s.full_name || s.email}
                </p>
                <p className="text-[10.5px] text-muted">
                  {s.role === "super_admin" ? "Super Admin" : "Admin"}
                </p>
              </div>
              <StatusBadge status={s.staff_status} />
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="flex h-[32px] w-full items-center justify-center rounded-[9px] border border-line bg-surface text-[12px] font-semibold text-muted transition-colors hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
