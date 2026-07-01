import { createAdminClient } from "@/lib/supabase/admin";

type ActivityType = "created" | "status_change" | "assignment" | "work_started" | "work_done" | "document" | "note";

type Activity = {
  id: string;
  type: ActivityType;
  message: string;
  created_at: string;
  actor: string | null;
};

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

const TYPE_CONFIG: Record<ActivityType, { color: string; bg: string; icon: React.ReactNode }> = {
  created: {
    color: "#6B7280",
    bg: "#F3F4F6",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
      </svg>
    ),
  },
  status_change: {
    color: "#2A5B9E",
    bg: "#EAF0FA",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
  },
  assignment: {
    color: "#E24020",
    bg: "rgba(226,64,32,0.10)",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  work_started: {
    color: "#D97706",
    bg: "#FFF8E7",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  work_done: {
    color: "#0D6B66",
    bg: "#E7F4F3",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  document: {
    color: "#7C3AED",
    bg: "#F5F0FF",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
      </svg>
    ),
  },
  note: {
    color: "#6B7280",
    bg: "#F3F4F6",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
};

export async function ActivityLog({ applicationId }: { applicationId: string }) {
  const admin = createAdminClient();

  const { data: raw } = await admin
    .from("application_activity")
    .select("id, type, message, created_at, user_id, profiles(full_name, email)")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })
    .limit(50);

  const activities: Activity[] = (raw || []).map((r) => {
    const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id as string,
      type: (r.type as ActivityType) || "note",
      message: r.message as string,
      created_at: r.created_at as string,
      actor: (p as { full_name?: string; email?: string } | null)?.full_name ||
             (p as { full_name?: string; email?: string } | null)?.email ||
             null,
    };
  });

  return (
    <div>
      <div className="border-b border-line px-[22px] py-[18px]">
        <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
          Activity
        </h3>
      </div>

      <div className="px-[22px] py-[18px]">
        {activities.length === 0 ? (
          <p className="text-[12.5px] text-muted">No activity yet.</p>
        ) : (
          <div className="relative flex flex-col gap-0">
            {/* Vertical line */}
            <div
              className="absolute left-[13px] top-[26px] w-[1.5px]"
              style={{
                bottom: "13px",
                background: "var(--line-2)",
              }}
            />

            {activities.map((item) => {
              const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.note;
              return (
                <div key={item.id} className="relative flex gap-[12px] pb-[16px] last:pb-0">
                  {/* Dot */}
                  <div
                    className="relative z-10 mt-[3px] flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-[3px]">
                    <p className="text-[12.5px] font-medium leading-snug text-ink">{item.message}</p>
                    <p className="mt-[3px] text-[11px] text-muted-2">
                      {item.actor && <span className="font-medium text-muted">{item.actor} · </span>}
                      {timeAgo(item.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
