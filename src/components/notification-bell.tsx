"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const STORAGE_KEY = "notif_last_read_at";

type NotifItem = {
  id: string;
  type: "application" | "document";
  title: string;
  subtitle: string;
  href: string;
  created_at: string;
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
  const [open, setOpen]           = useState(false);
  const [items, setItems]         = useState<NotifItem[]>([]);
  const [loading, setLoading]     = useState(false);
  const [lastRead, setLastRead]   = useState(0);
  const [badgeCount, setBadgeCount] = useState(count);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Realtime subscription — live updates without page refresh
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-notif-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "applications", filter: "status=eq.submitted" },
        (payload) => {
          const a = payload.new as { id: string; ref: string; service_name: string; created_at: string };
          setBadgeCount((n) => n + 1);
          setItems((prev) => [
            {
              id: `app-${a.id}`,
              type: "application",
              title: `New application ${a.ref}`,
              subtitle: a.service_name,
              href: `/applications/${a.id}`,
              created_at: a.created_at,
            },
            ...prev,
          ]);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_documents", filter: "status=eq.pending" },
        (payload) => {
          const d = payload.new as { id: string; doc_type: string; file_name: string; created_at: string };
          const subtitle = (d.doc_type || "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()) || d.file_name || "New document";
          setBadgeCount((n) => n + 1);
          setItems((prev) => [
            {
              id: `doc-${d.id}`,
              type: "document",
              title: "Document uploaded",
              subtitle,
              href: "/documents",
              created_at: d.created_at,
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // On mount: read lastRead from localStorage, then recount only unread items
  useEffect(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    setLastRead(stored);

    if (stored === 0) {
      // Never marked as read — use server count as-is
      return;
    }

    // There's a stored timestamp — check how many items arrived AFTER it
    const supabase = createClient();
    const since = new Date(stored).toISOString();

    Promise.all([
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted")
        .gt("created_at", since),
      supabase
        .from("user_documents")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .gt("created_at", since),
    ]).then(([{ count: a }, { count: d }]) => {
      setBadgeCount((a ?? 0) + (d ?? 0));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();

    Promise.all([
      supabase
        .from("applications")
        .select("id, ref, service_name, created_at")
        .eq("status", "submitted")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("user_documents")
        .select("id, doc_type, file_name, created_at, user_id")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10),
    ]).then(([{ data: apps }, { data: docs }]) => {
      const appItems: NotifItem[] = (apps || []).map((a) => ({
        id: `app-${a.id}`,
        type: "application",
        title: `New application ${a.ref}`,
        subtitle: a.service_name,
        href: `/applications/${a.id}`,
        created_at: a.created_at,
      }));

      const docItems: NotifItem[] = (docs || []).map((d) => ({
        id: `doc-${d.id}`,
        type: "document",
        title: "Document uploaded",
        subtitle: (d.doc_type as string || "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || d.file_name || "New document",
        href: `/documents`,
        created_at: d.created_at,
      }));

      const merged = [...appItems, ...docItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setItems(merged);
      setLoading(false);
    });
  }, [open]);

  useEffect(() => {
    if (items.length === 0) return;
    const unread = items.filter(
      (i) => new Date(i.created_at).getTime() > lastRead
    ).length;
    setBadgeCount(unread);
  }, [items, lastRead]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function markAllRead() {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, String(now));
    setLastRead(now);
    setBadgeCount(0);
  }

  const isUnread = (item: NotifItem) =>
    new Date(item.created_at).getTime() > lastRead;

  const displayCount = badgeCount > 0 ? badgeCount : 0;

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
        {displayCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[4px] text-[10px] font-bold text-white"
            style={{ background: "var(--amer-700, #E24020)" }}
          >
            {displayCount > 99 ? "99+" : displayCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[360px] overflow-hidden rounded-[16px] border border-line bg-surface"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-[15px]">
            <div className="flex items-center gap-[9px]">
              <h3 className="text-[15px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                Notifications
              </h3>
              {displayCount > 0 && (
                <span
                  className="flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-[5px] text-[10px] font-bold text-white"
                  style={{ background: "var(--amer-700, #E24020)" }}
                >
                  {displayCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {displayCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[12px] font-semibold text-muted transition-colors hover:text-ink"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/applications?status=submitted"
                onClick={() => setOpen(false)}
                className="text-[12px] font-semibold hover:underline"
                style={{ color: "var(--amer-700, #E24020)" }}
              >
                View all
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div
                  className="h-5 w-5 animate-spin rounded-full border-2"
                  style={{ borderColor: "var(--line)", borderTopColor: "var(--amer-700, #E24020)" }}
                />
              </div>
            ) : items.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-bg-card text-muted-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-muted">All caught up</p>
                <p className="mt-1 text-[12px] text-muted-2">No pending items</p>
              </div>
            ) : (
              items.map((item) => {
                const unread = isUnread(item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-[13px] border-b border-line-2 px-5 py-[13px] transition-colors last:border-none hover:bg-bg-card"
                    style={unread ? { background: "rgba(226,64,32,0.03)" } : undefined}
                  >
                    {/* Icon */}
                    <div
                      className="mt-[2px] flex h-[36px] w-[36px] flex-shrink-0 items-center justify-center rounded-[10px]"
                      style={{ background: unread ? "rgba(226,64,32,0.12)" : "rgba(0,0,0,0.06)" }}
                    >
                      {item.type === "application" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" stroke={unread ? "#E24020" : "#888"}>
                          <rect x="4" y="3" width="16" height="18" rx="2" />
                          <path d="M8 8h8M8 12h8M8 16h5" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" stroke={unread ? "#E24020" : "#888"}>
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                          <path d="M12 18v-6M9 15l3 3 3-3" />
                        </svg>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] ${unread ? "font-semibold text-ink" : "font-medium text-muted"}`}>
                        {item.title}
                      </p>
                      <p className="mt-[2px] truncate text-[12px] text-muted-2">{item.subtitle}</p>
                      <p className="mt-[3px] text-[11px] text-muted-2">{timeAgo(item.created_at)}</p>
                    </div>

                    {/* Unread dot */}
                    {unread && (
                      <div
                        className="mt-[7px] h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ background: "var(--amer-700, #E24020)" }}
                      />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-line px-5 py-[11px]">
              <Link
                href="/documents"
                onClick={() => setOpen(false)}
                className="block text-center text-[12.5px] font-semibold hover:underline"
                style={{ color: "var(--amer-700, #E24020)" }}
              >
                Go to Documents →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
