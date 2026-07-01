"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { leaveApplicationAction } from "@/app/actions/leave-application";

export function EngageButton({
  applicationId,
  currentUserId,
  initialStatus,
  assignedTo,
  assignmentStatus,
}: {
  applicationId: string;
  currentUserId: string;
  initialStatus: "free" | "engaged";
  assignedTo: string | null;
  assignmentStatus: string | null;
}) {
  const router = useRouter();
  const [myStatus, setMyStatus]     = useState(initialStatus);
  const [saving, setSaving]         = useState(false);
  const [showLeave, setShowLeave]   = useState(false);

  const assignedToMe = assignedTo === currentUserId;
  const isQueued     = assignmentStatus === "queued";

  const startWorking = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("profiles").update({ staff_status: "engaged" }).eq("id", currentUserId);
      if (!assignedTo) {
        await supabase
          .from("applications")
          .update({ assigned_to: currentUserId, assignment_status: "assigned" })
          .eq("id", applicationId);
      } else if (assignedToMe && isQueued) {
        // Was queued — now they're free so promote to assigned
        await supabase
          .from("applications")
          .update({ assignment_status: "assigned" })
          .eq("id", applicationId);
      }
      await supabase.from("application_activity").insert({
        application_id: applicationId,
        user_id: currentUserId,
        type: "work_started",
        message: "Started working",
      });
      setMyStatus("engaged");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const markDone = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      await Promise.all([
        supabase.from("profiles").update({ staff_status: "free" }).eq("id", currentUserId),
        supabase.from("applications").update({ assignment_status: "done" }).eq("id", applicationId).eq("assigned_to", currentUserId),
      ]);
      setMyStatus("free");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const leaveApplication = async () => {
    setSaving(true);
    setShowLeave(false);
    try {
      await leaveApplicationAction(applicationId);
      setMyStatus("free");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  // Leave confirmation popup
  const LeavePopup = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6" style={{ background: "rgba(26,10,5,0.5)", backdropFilter: "blur(3px)" }}>
      <div className="animate-modal-in w-full max-w-[340px] overflow-hidden rounded-[18px] border border-line bg-surface" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div className="px-[24px] pb-[20px] pt-[24px]">
          <div className="mb-[14px] flex h-[44px] w-[44px] items-center justify-center rounded-[13px]" style={{ background: "rgba(181,50,36,0.10)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B53224" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </div>
          <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
            Leave this application?
          </h3>
          <p className="mt-[6px] text-[13px] leading-[1.55] text-muted">
            You will be removed from this application and your status will be set to <strong className="text-ink">Free</strong>. Anyone else can take it.
          </p>
        </div>
        <div className="flex gap-[8px] border-t border-line px-[24px] py-[16px]">
          <button
            onClick={() => setShowLeave(false)}
            className="flex h-[38px] flex-1 items-center justify-center rounded-[10px] border border-line bg-surface text-[13px] font-semibold text-ink transition-colors hover:border-muted-2"
          >
            Cancel
          </button>
          <button
            onClick={leaveApplication}
            disabled={saving}
            className="flex h-[38px] flex-1 items-center justify-center rounded-[10px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "#B53224" }}
          >
            {saving ? "Leaving…" : "Yes, leave"}
          </button>
        </div>
      </div>
    </div>
  );

  // Queued state — only show when they're still engaged on something else
  if (assignedToMe && isQueued && myStatus === "engaged") {
    return (
      <>
        {showLeave && <LeavePopup />}
        <div className="rounded-[11px] border border-[#FFF0CC] bg-[#FFFBF0] px-[14px] py-[12px]">
          <div className="mb-[4px] flex items-center gap-[8px]">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#A6822F]" />
            <p className="text-[12.5px] font-semibold text-[#A6822F]">Queued for you</p>
          </div>
          <p className="text-[11.5px] leading-[1.5] text-[#A6822F]">
            This application is in your queue. Finish your current task first, then start working on this.
          </p>
          <button
            onClick={() => setShowLeave(true)}
            className="mt-[10px] flex h-[30px] w-full items-center justify-center gap-[6px] rounded-[8px] border border-[#F0D0CC] bg-[#FFF5F3] text-[11.5px] font-semibold text-[#B53224] transition-colors hover:border-[#C0392B]"
          >
            Leave application
          </button>
        </div>
      </>
    );
  }

  // Engaged + assigned to me → Mark as done or Leave
  if (myStatus === "engaged" && assignedToMe) {
    return (
      <>
        {showLeave && <LeavePopup />}
        <div className="flex flex-col gap-[8px]">
          <button
            onClick={markDone}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] py-[11px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #1BA39C, #0D6B66)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {saving ? "Saving…" : "Mark as done"}
          </button>
          <button
            onClick={() => setShowLeave(true)}
            className="flex h-[32px] w-full items-center justify-center gap-[6px] rounded-[9px] border border-line bg-surface text-[12px] font-semibold text-muted transition-colors hover:border-muted-2 hover:text-ink"
          >
            Leave application
          </button>
        </div>
      </>
    );
  }

  // Engaged elsewhere
  if (myStatus === "engaged") {
    return (
      <div className="rounded-[11px] border border-line bg-bg-card px-[14px] py-[12px]">
        <div className="mb-[6px] flex items-center gap-[8px]">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#E24020]" />
          <p className="text-[12.5px] font-semibold text-ink">You&apos;re currently engaged</p>
        </div>
        <p className="text-[11.5px] leading-[1.5] text-muted">
          Finish your current task before taking on a new one.
        </p>
        <button
          onClick={markDone}
          disabled={saving}
          className="mt-[10px] flex h-[32px] w-full items-center justify-center rounded-[9px] border border-line bg-surface text-[12px] font-semibold text-ink transition-colors hover:border-muted-2 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Mark me as free"}
        </button>
      </div>
    );
  }

  // Free → Start working
  return (
    <button
      onClick={startWorking}
      disabled={saving}
      className="flex w-full items-center justify-center gap-2 rounded-[12px] py-[11px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: "linear-gradient(135deg, #FF6B4A, #E24020)", boxShadow: "var(--shadow-primary)" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {saving ? "Saving…" : "Start working"}
    </button>
  );
}
