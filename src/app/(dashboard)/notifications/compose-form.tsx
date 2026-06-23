"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { saveDraft, sendBroadcast, sendDraft, deleteBroadcast, getAudienceTokenCount } from "./actions";

const AUDIENCES = [
  { value: "all",       label: "All users",   desc: "Every registered account" },
  { value: "submitted", label: "Submitted",   desc: "Applications awaiting triage" },
  { value: "in_review", label: "In Review",   desc: "Applications being reviewed" },
  { value: "scheduled", label: "Scheduled",   desc: "Branch visit booked" },
  { value: "approved",  label: "Approved",    desc: "Completed applications" },
  { value: "rejected",  label: "Rejected",    desc: "Declined applications" },
] as const;

const CHANNELS = [
  { value: "push",       label: "Push",        icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { value: "push+email", label: "Push + Email", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
] as const;

function ToastBanner({ msg, type, onDone }: { msg: string; type: "ok" | "err"; onDone: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex max-w-[340px] items-start gap-3 rounded-[14px] px-5 py-[13px] text-[13px] font-semibold text-white"
      style={{ background: type === "ok" ? "#1A2B1A" : "#2B1A1A", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
    >
      {type === "ok" ? (
        <svg className="mt-[1px] flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg className="mt-[1px] flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      )}
      <span className={type === "err" ? "text-[#FF9999]" : ""}>{msg}</span>
      <button onClick={onDone} className="ml-auto flex-shrink-0 opacity-50 hover:opacity-100">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

export function ComposeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [audience, setAudience] = useState("all");
  const [channel, setChannel]   = useState("push");
  const [title, setTitle]       = useState("");
  const [message, setMessage]   = useState("");
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // Refresh device count whenever audience changes
  useEffect(() => {
    let cancelled = false;
    setDeviceCount(null);
    setCountLoading(true);
    getAudienceTokenCount(audience).then((n) => {
      if (!cancelled) { setDeviceCount(n); setCountLoading(false); }
    });
    return () => { cancelled = true; };
  }, [audience]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const reset = () => { setTitle(""); setMessage(""); setAudience("all"); setChannel("push"); };

  const handleDraft = () => {
    if (!title.trim() || !message.trim()) return;
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      try {
        await saveDraft(fd);
        reset();
        showToast("Saved as draft");
      } catch (e) {
        showToast((e as Error).message || "Failed to save draft. Run the SQL migration first.", "err");
      }
    });
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    if (deviceCount === 0) {
      showToast("No push tokens found for this audience. Users must open the app first.", "err");
      return;
    }
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      try {
        await sendBroadcast(fd);
        reset();
        showToast(`Broadcast sent to ${deviceCount ?? "??"} device${deviceCount !== 1 ? "s" : ""}`);
      } catch (e) {
        showToast((e as Error).message || "Failed to send. Check that the broadcasts table exists.", "err");
      }
    });
  };

  const inp = "w-full rounded-[11px] border-[1.5px] border-line bg-surface px-[13px] py-[10px] text-[13.5px] text-ink placeholder:text-muted-2 outline-none transition-all";
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = "#FF9669";
      e.target.style.boxShadow  = "0 0 0 4px rgba(255,81,47,0.1)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = "";
      e.target.style.boxShadow  = "";
    },
  };

  const canSend = title.trim().length > 0 && message.trim().length > 0 && !isPending;

  return (
    <>
      <form ref={formRef} onSubmit={(e) => e.preventDefault()}>
        <h3 className="mb-[16px] text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
          New broadcast
        </h3>

        {/* Title */}
        <div className="mb-[12px]">
          <label className="mb-[6px] block text-[12px] font-semibold text-ink">Title</label>
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Centre open during Eid" className={inp} {...focusHandlers} />
        </div>

        {/* Audience */}
        <div className="mb-[12px]">
          <div className="mb-[6px] flex items-center justify-between">
            <label className="text-[12px] font-semibold text-ink">Audience</label>
            <span className={`text-[11px] font-semibold ${deviceCount === 0 ? "text-[#B53224]" : "text-muted-2"}`}>
              {countLoading ? "counting…" : deviceCount === null ? "" : deviceCount === 0 ? "⚠ 0 devices — no push tokens saved" : `${deviceCount} device${deviceCount !== 1 ? "s" : ""} will receive this`}
            </span>
          </div>
          <select name="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className={`${inp} appearance-none`} {...focusHandlers}>
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>{a.label} — {a.desc}</option>
            ))}
          </select>
        </div>

        {/* Channel */}
        <div className="mb-[12px]">
          <label className="mb-[6px] block text-[12px] font-semibold text-ink">Channel</label>
          <div className="grid grid-cols-2 gap-2">
            {CHANNELS.map((c) => (
              <button key={c.value} type="button" onClick={() => setChannel(c.value)}
                className={`flex items-center gap-2 rounded-[10px] border-[1.5px] px-[11px] py-[9px] text-[12.5px] font-semibold transition-colors ${
                  channel === c.value ? "border-amer-700 bg-primary-bg text-amer-600" : "border-line bg-surface text-text hover:border-muted-2"
                }`}
              >
                <input type="radio" name="channel" value={c.value} checked={channel === c.value} onChange={() => setChannel(c.value)} className="sr-only" />
                {c.icon}{c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="mb-[16px]">
          <label className="mb-[6px] block text-[12px] font-semibold text-ink">Message</label>
          <textarea name="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your notification message…" rows={4} className={`${inp} resize-none`} {...focusHandlers} />
          <p className="mt-[3px] text-right text-[11px] text-muted-2">{message.length} / 200</p>
        </div>

        {/* Push preview */}
        {(title || message) && (
          <div className="mb-[16px] rounded-[12px] border border-line bg-bg-card p-[12px]">
            <p className="mb-[6px] text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-2">Push preview</p>
            <div className="flex gap-[10px]">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-white" style={{ background: "linear-gradient(155deg,#E24020,#7A1508)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-ink">{title || "Title"}</p>
                <p className="mt-[1px] line-clamp-2 text-[12px] text-muted">{message || "Message…"}</p>
              </div>
            </div>
          </div>
        )}

        {/* 0 devices warning */}
        {deviceCount === 0 && (
          <div className="mb-[14px] flex items-start gap-[10px] rounded-[11px] border border-[#FBD5D0] bg-[#FFF5F3] px-[14px] py-[12px]">
            <svg className="mt-[1px] flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B53224" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="text-[12px] text-[#B53224]">
              No push tokens saved for this audience. Users need to open the app while signed in to register their device.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button type="button" disabled={!canSend} onClick={handleDraft}
            className="flex h-[40px] flex-1 items-center justify-center gap-2 rounded-[11px] border-[1.5px] border-line bg-surface text-[13px] font-semibold text-ink transition-colors hover:border-muted-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save draft
          </button>
          <button type="button" disabled={!canSend} onClick={handleSend}
            className="flex h-[40px] flex-1 items-center justify-center gap-2 rounded-[11px] text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#FF6B4A,#E24020)", boxShadow: "var(--shadow-primary)" }}
          >
            {isPending
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="animate-spin"><circle cx="12" cy="12" r="10" strokeOpacity={0.25}/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            }
            {isPending ? "Sending…" : "Send now"}
          </button>
        </div>
      </form>

      {toast && <ToastBanner msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}

export function BroadcastActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const act = (fn: () => Promise<void>, ok: string) => {
    startTransition(async () => {
      try { await fn(); setToast({ msg: ok, type: "ok" }); }
      catch (e) { setToast({ msg: (e as Error).message || "Error", type: "err" }); }
      setTimeout(() => setToast(null), 3000);
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {status === "draft" && (
          <button disabled={isPending} title="Send now"
            onClick={() => act(() => sendDraft(id), "Broadcast sent")}
            className="flex h-8 items-center gap-[6px] rounded-[9px] bg-primary-bg px-3 text-[12px] font-semibold text-amer-700 transition-colors hover:bg-amer-700 hover:text-white disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send
          </button>
        )}
        <button disabled={isPending} title="Delete"
          onClick={() => act(() => deleteBroadcast(id), "Deleted")}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-bg-card text-muted transition-colors hover:bg-[#FBE9E7] hover:text-[#B53224] disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 rounded-[14px] px-5 py-[13px] text-[13px] font-semibold text-white" style={{ background: toast.type === "ok" ? "#1A2B1A" : "#2B1A1A", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>
          {toast.type === "ok"
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF9999" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          <span className={toast.type === "err" ? "text-[#FF9999]" : ""}>{toast.msg}</span>
        </div>
      )}
    </>
  );
}
