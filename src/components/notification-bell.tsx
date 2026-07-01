"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type NotifItem = {
  id: string;
  type: "application" | "document" | "assignment";
  title: string;
  subtitle: string;
  href: string;
  created_at: string;
  is_read: boolean;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell({ count }: { count: number }) {
  const [open, setOpen]             = useState(false);
  const [items, setItems]           = useState<NotifItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [unreadCount, setUnreadCount] = useState(count);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Get current user + refresh unread count from DB
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setCurrentUserId(user.id);
      supabase
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)
        .then(({ count: c }) => setUnreadCount(c ?? 0));
    });
  }, []);

  // Realtime: new notification inserted for current user
  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("admin-notif-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications", filter: `user_id=eq.${currentUserId}` },
        (payload) => {
          const n = payload.new as { id: string; type: string; title: string; body: string | null; href: string | null; is_read: boolean; created_at: string };
          setUnreadCount((c) => c + 1);
          setItems((prev) => [{
            id: n.id,
            type: (n.type || "assignment") as NotifItem["type"],
            title: n.title,
            subtitle: n.body || "",
            href: n.href || "/applications",
            created_at: n.created_at,
            is_read: false,
          }, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  // Load items when panel opens
  useEffect(() => {
    if (!open || !currentUserId) return;
    setLoading(true);
    createClient()
      .from("admin_notifications")
      .select("id, type, title, body, href, is_read, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setItems((data || []).map((n) => ({
          id: n.id as string,
          type: ((n.type as string) || "assignment") as NotifItem["type"],
          title: n.title as string,
          subtitle: (n.body as string) || "",
          href: (n.href as string) || "/applications",
          created_at: n.created_at as string,
          is_read: n.is_read as boolean,
        })));
        setLoading(false);
      });
  }, [open, currentUserId]);

  // Outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function markAllRead() {
    setUnreadCount(0);
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    if (currentUserId) {
      createClient()
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("user_id", currentUserId)
        .eq("is_read", false)
        .then(() => {});
    }
  }

  const ICON = {
    application: (color: string) => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" stroke={color}>
        <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
    assignment: (color: string) => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" stroke={color}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    document: (color: string) => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" stroke={color}>
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
      </svg>
    ),
  };

  return (
    <div ref={wrapRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-[42px] w-[42px] items-center justify-center rounded-[12px] border border-line bg-surface text-text transition-colors hover:border-muted-2"
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[4px] text-[10px] font-bold text-white"
            style={{ background: "var(--amer-700, #E24020)" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="animate-dropdown-in absolute right-0 top-[calc(100%+10px)] z-50 w-[360px] overflow-hidden rounded-[16px] border border-line bg-surface"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-[15px]">
            <div className="flex items-center gap-[9px]">
              <h3 className="text-[15px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span
                  className="flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-[5px] text-[10px] font-bold text-white"
                  style={{ background: "var(--amer-700, #E24020)" }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[12px] font-semibold text-muted transition-colors hover:text-ink">
                  Mark all read
                </button>
              )}
              <Link
                href="/inbox"
                onClick={() => setOpen(false)}
                className="text-[12px] font-semibold hover:underline"
                style={{ color: "var(--amer-700, #E24020)" }}
              >
                View all
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: "var(--line)", borderTopColor: "var(--amer-700, #E24020)" }} />
              </div>
            ) : items.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-bg-card text-muted-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-muted">All caught up</p>
                <p className="mt-1 text-[12px] text-muted-2">No notifications yet</p>
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-[13px] border-b border-line-2 px-5 py-[13px] transition-colors last:border-none hover:bg-bg-card"
                  style={!item.is_read ? { background: "rgba(226,64,32,0.03)" } : undefined}
                >
                  <div
                    className="mt-[2px] flex h-[36px] w-[36px] flex-shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: !item.is_read ? "rgba(226,64,32,0.12)" : "rgba(0,0,0,0.06)" }}
                  >
                    {ICON[item.type](!item.is_read ? "#E24020" : "#888")}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className={`truncate text-[13px] ${!item.is_read ? "font-semibold text-ink" : "font-medium text-muted"}`}>
                      {item.title}
                    </p>
                    <p className="mt-[2px] truncate text-[12px] text-muted-2">{item.subtitle}</p>
                    <p className="mt-[3px] text-[11px] text-muted-2">{timeAgo(item.created_at)}</p>
                  </div>
                  {!item.is_read && (
                    <div className="mt-[7px] h-2 w-2 flex-shrink-0 rounded-full" style={{ background: "var(--amer-700, #E24020)" }} />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-line px-5 py-[12px]">
            <Link
              href="/inbox"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-[11px] py-[10px] text-[13px] font-semibold transition-colors hover:bg-bg-card"
              style={{ color: "var(--amer-700, #E24020)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              View inbox
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
