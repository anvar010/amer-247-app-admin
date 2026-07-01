import { getSessionUser } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { MarkInboxRead } from "./mark-read";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE_META = {
  application: {
    icon: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
    label: "Application",
    pill: "bg-[#EAF0FA] text-[#2A5B9E]",
  },
  assignment: {
    icon: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    label: "Assignment",
    pill: "bg-primary-bg text-amer-600",
  },
  document: {
    icon: (color: string) => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
      </svg>
    ),
    label: "Document",
    pill: "bg-[#FFF8E7] text-[#A6822F]",
  },
} as const;

type NotifType = keyof typeof TYPE_META;

export default async function InboxPage() {
  const { user } = await getSessionUser();
  const admin = createAdminClient();

  const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: notifications } = user
    ? await admin
        .from("admin_notifications")
        .select("id, type, title, body, href, is_read, created_at")
        .eq("user_id", user.id)
        .gte("created_at", since30Days)
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };

  const items = (notifications || []) as {
    id: string;
    type: string;
    title: string;
    body: string | null;
    href: string | null;
    is_read: boolean;
    created_at: string;
  }[];

  const unreadCount = items.filter((n) => !n.is_read).length;

  const cardCls = "rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden";
  const cardShadow = { boxShadow: "var(--shadow-card)" };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-[19px] font-extrabold tracking-tight text-ink"
            style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
          >
            Inbox
          </h2>
          <p className="mt-[3px] text-[13px] text-muted">
            {items.length} notification{items.length !== 1 ? "s" : ""}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary-bg px-[8px] py-[2px] text-[11px] font-bold text-amer-600">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && user && <MarkInboxRead userId={user.id} />}
      </div>

      <div className={cardCls} style={cardShadow}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-[14px] flex h-14 w-14 items-center justify-center rounded-[16px] bg-bg-card text-muted-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-ink">All caught up</p>
            <p className="mt-1 text-[13px] text-muted">No notifications yet.</p>
          </div>
        ) : (
          items.map((item, i) => {
            const type = (item.type || "assignment") as NotifType;
            const meta = TYPE_META[type] ?? TYPE_META.assignment;
            const unread = !item.is_read;
            return (
              <Link
                key={item.id}
                href={item.href || "/applications"}
                className={`flex items-start gap-[14px] px-[22px] py-[15px] transition-colors hover:bg-bg-card ${
                  i < items.length - 1 ? "border-b border-line-2" : ""
                }`}
                style={unread ? { background: "rgba(226,64,32,0.025)" } : undefined}
              >
                {/* Icon */}
                <div
                  className="mt-[1px] flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-[12px]"
                  style={{
                    background: unread ? "rgba(226,64,32,0.12)" : "var(--bg-card)",
                  }}
                >
                  {meta.icon(unread ? "#E24020" : "var(--muted)")}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[13.5px] leading-snug ${unread ? "font-semibold text-ink" : "font-medium text-muted"}`}>
                        {item.title}
                      </p>
                      {item.body && (
                        <p className="mt-[3px] truncate text-[12.5px] text-muted-2">{item.body}</p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-[8px]">
                      <span className={`inline-flex items-center rounded-full px-[8px] py-[2px] text-[10.5px] font-bold ${meta.pill}`}>
                        {meta.label}
                      </span>
                      <span className="whitespace-nowrap text-[11.5px] text-muted-2">{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Unread dot */}
                {unread && (
                  <div className="mt-[10px] h-2 w-2 flex-shrink-0 rounded-full bg-amer-700" />
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
