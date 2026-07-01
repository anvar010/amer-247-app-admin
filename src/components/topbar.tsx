"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notification-bell";

const PAGE_META: Record<string, [string, string]> = {
  "/":              ["Dashboard",      "Welcome back — here is what needs attention today"],
  "/applications":  ["Applications",   "Review and process submitted applications"],
  "/documents":      ["Documents",      "Uploads from the AMER 24/7 app, grouped by applicant"],
  "/notifications":  ["Notifications",  "Broadcast push notifications to app users"],
  "/users":         ["Users",          "Registered AMER 24/7 app users"],
  "/staff":         ["Staff & roles",  "Console users and permissions"],
  "/wallet":        ["Wallet",         "Bonus amounts, service caps & promotional credits"],
  "/inbox":         ["Inbox",          "Your notifications and assigned applications"],
};

export function Topbar({ notifCount = 0 }: { notifCount?: number }) {
  const pathname = usePathname();

  let entry = PAGE_META[pathname];
  if (!entry) {
    const match = Object.entries(PAGE_META).find(
      ([key]) => key !== "/" && pathname.startsWith(key)
    );
    if (match) entry = match[1];
  }
  const [title, subtitle] = entry ?? ["", ""];

  return (
    <header
      className="flex h-[70px] flex-shrink-0 items-center gap-4 border-b border-line px-7"
      style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(12px)" }}
    >
      <div className="flex-1 min-w-0">
        <h1
          className="text-[21px] font-extrabold leading-[1.1] tracking-tight text-ink"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[12.5px] text-muted">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        <NotificationBell count={notifCount} />
        <button
          className="flex h-[42px] w-[42px] items-center justify-center rounded-[12px] border border-line bg-surface text-text transition-colors hover:border-muted-2"
          title="Help"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
        </button>
      </div>
    </header>
  );
}
