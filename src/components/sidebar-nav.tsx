"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ── Icons ────────────────────────────────────────────────────────────────────
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12 8 8" /><circle cx="12" cy="12" r="1.5" />
    </svg>
  ),
  applications: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  applicants: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  staff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M12 2 3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <circle cx="17" cy="13" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  signout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};

// ── Nav structure ─────────────────────────────────────────────────────────────
type NavLink = { href: string; label: string; icon: React.ReactNode; superAdminOnly?: boolean };
type Section = { label: string; links: NavLink[] };

const NAV: Section[] = [
  {
    label: "OVERVIEW",
    links: [
      { href: "/",             label: "Dashboard",     icon: icons.dashboard },
    ],
  },
  {
    label: "OPERATIONS",
    links: [
      { href: "/applications", label: "Applications",  icon: icons.applications },
      { href: "/documents",    label: "Documents",      icon: icons.documents },
      { href: "/inbox",        label: "Inbox",          icon: icons.inbox },
      { href: "/notifications",label: "Notifications",  icon: icons.notifications },
    ],
  },
  {
    label: "MANAGE",
    links: [
      { href: "/users",        label: "Users",         icon: icons.applicants },
      { href: "/staff",        label: "Staff & roles", icon: icons.staff, superAdminOnly: true },
    ],
  },
  {
    label: "SETTINGS",
    links: [
      { href: "/wallet",       label: "Wallet",        icon: icons.wallet },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function SidebarNav({
  isSuperAdmin,
  displayName,
  userRole,
  badges = {},
}: {
  isSuperAdmin: boolean;
  displayName: string;
  userRole: string;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Gold glow decoration */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: -120, right: -90, width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,162,75,0.14), transparent 65%)",
          zIndex: 0,
        }}
      />

      {/* Brand */}
      <div className="relative z-10 flex items-center gap-[11px] px-5 pb-[18px] pt-[22px]">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-[16px] font-extrabold"
          style={{
            background: "linear-gradient(155deg, #E3C77E, #A6822F)",
            color: "#2a1f00",
            boxShadow: "0 12px 26px rgba(201,162,75,0.34)",
            fontFamily: "var(--font-outfit)",
          }}
        >
          A
        </div>
        <div>
          <p
            className="text-[16px] font-extrabold leading-[1.1] text-white"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            AMER 24/7
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
            Admin Console
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex flex-1 flex-col overflow-y-auto px-3 py-1.5" style={{ scrollbarWidth: "thin" }}>
        {NAV.map((section) => {
          const links = section.links.filter((l) => !l.superAdminOnly || isSuperAdmin);
          if (!links.length) return null;
          return (
            <div key={section.label}>
              <p className="px-3 pb-[7px] pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                {section.label}
              </p>
              <div className="flex flex-col gap-[2px]">
                {links.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative flex items-center gap-3 rounded-[11px] px-3 py-[10px] text-[14px] transition-colors duration-150 active:scale-[0.98] ${
                        active
                          ? "font-semibold text-white"
                          : "font-medium text-white/[.74] hover:text-white"
                      }`}
                      style={{
                        background: active ? "rgba(255,255,255,0.12)" : undefined,
                        boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,0.08)" : undefined,
                        transition: "background 0.15s, color 0.15s, transform 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                      }}
                      onMouseLeave={(e) => {
                        if (!active) (e.currentTarget as HTMLElement).style.background = "";
                      }}
                    >
                      {active && (
                        <span
                          className="animate-indicator absolute rounded-r-[3px]"
                          style={{
                            left: -12, top: 9, bottom: 9, width: 3,
                            background: "#E3C77E",
                          }}
                        />
                      )}
                      <span className="flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center" style={{ opacity: 0.92 }}>
                        {link.icon}
                      </span>
                      <span className="flex-1">{link.label}</span>
                      {(badges[link.href] ?? 0) > 0 && (
                        <span
                          className="ml-auto flex min-w-[20px] items-center justify-center rounded-[10px] px-[6px] py-0 text-[11px] font-bold leading-5"
                          style={
                            link.href === "/documents"
                              ? { background: "var(--gold-light, #E3C77E)", color: "#2a1f00" }
                              : { background: "var(--amer-700, #E24020)", color: "#fff" }
                          }
                        >
                          {badges[link.href]}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div
        className="relative z-10 mx-3 mb-[14px] mt-2 flex items-center gap-[11px] rounded-[14px] p-3"
        style={{ background: "rgba(0,0,0,0.22)" }}
      >
        <div
          className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] text-[14px] font-bold text-white"
          style={{ background: "linear-gradient(155deg, #FF6B4A, #FF512F)" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-white">{displayName}</p>
          <p className="text-[11.5px]" style={{ color: "#E3C77E" }}>
            {userRole === "super_admin" ? "Super Admin" : "Admin"}
          </p>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="flex rounded-[8px] p-1.5 text-white/55 transition hover:text-white"
          style={{ transition: "all 0.2s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = ""; }}
        >
          {icons.signout}
        </button>
      </div>
    </div>
  );
}
