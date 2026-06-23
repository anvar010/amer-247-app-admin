"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createStaffMember } from "./actions";

type PermKey = "can_view_all_applications" | "can_change_application_status" | "can_manage_documents" | "can_send_notifications";
type PermsState = Record<PermKey, boolean>;

const PERM_META: { key: PermKey; label: string; sub: string }[] = [
  { key: "can_view_all_applications",     label: "View all applications",     sub: "Access the full applications list" },
  { key: "can_change_application_status", label: "Change application status", sub: "Approve, reject or update any application" },
  { key: "can_manage_documents",          label: "Manage documents",          sub: "Verify or reject uploaded documents" },
  { key: "can_send_notifications",        label: "Send notifications",        sub: "Broadcast push & email to applicants" },
];

const DEFAULT_PERMS: PermsState = {
  can_view_all_applications: false,
  can_change_application_status: false,
  can_manage_documents: false,
  can_send_notifications: false,
};

const ROLES = [
  {
    value: "admin" as const,
    label: "Admin",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    value: "super_admin" as const,
    label: "Super Admin",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z" /><path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

export function AddStaffForm() {
  const [open, setOpen]   = useState(false);
  const [role, setRole]   = useState<"admin" | "super_admin">("admin");
  const [perms, setPerms] = useState<PermsState>(DEFAULT_PERMS);
  const [state, action, pending] = useActionState(createStaffMember, null);
  const formRef = useRef<HTMLFormElement>(null);

  const togglePerm = (key: PermKey) => setPerms((p) => ({ ...p, [key]: !p[key] }));

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      formRef.current?.reset();
      setRole("admin");
      setPerms(DEFAULT_PERMS);
    }
  }, [state?.success]);

  const close = () => {
    setOpen(false);
    setRole("admin");
    setPerms(DEFAULT_PERMS);
    formRef.current?.reset();
  };

  const inputCls =
    "h-[50px] w-full rounded-[13px] border-[1.5px] border-line bg-surface px-[14px] text-[14.5px] text-ink placeholder:text-muted-2 outline-none transition-shadow focus:border-amer-400";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[13px] bg-amer-700 px-4 py-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-amer-600"
        style={{ boxShadow: "var(--shadow-primary)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Invite member
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-6"
          style={{ background: "rgba(26,10,5,0.5)", backdropFilter: "blur(3px)", animation: "fadeIn 0.2s ease both" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            className="w-full max-w-[580px] overflow-hidden bg-surface"
            style={{ borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)", animation: "rise 0.25s ease both" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-3 px-[22px] pt-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-primary-bg text-amer-700">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              <div>
                <h3
                  className="text-[19px] font-extrabold text-ink"
                  style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
                >
                  Invite team member
                </h3>
                <p className="mt-[3px] text-[13.5px] text-muted">
                  Create their account and set a temporary password.
                </p>
              </div>
            </div>

            {/* Form (wraps body + footer so submit button works) */}
            <form ref={formRef} action={action}>
              <input type="hidden" name="role" value={role} />

              <div className="px-[22px] py-[18px] flex flex-col gap-4">
                {/* Full name */}
                <div>
                  <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">Full name</label>
                  <input
                    name="full_name"
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Noura Al Ali"
                    className={inputCls}
                    onFocus={(e) => { e.target.style.boxShadow = "0 0 0 4px rgba(255,81,47,0.1)"; }}
                    onBlur={(e)  => { e.target.style.boxShadow = ""; }}
                  />
                </div>

                {/* Work email */}
                <div>
                  <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">Work email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="name@amer247.ae"
                    className={inputCls}
                    onFocus={(e) => { e.target.style.boxShadow = "0 0 0 4px rgba(255,81,47,0.1)"; }}
                    onBlur={(e)  => { e.target.style.boxShadow = ""; }}
                  />
                </div>

                {/* Temporary password */}
                <div>
                  <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">Temporary password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className={inputCls}
                    onFocus={(e) => { e.target.style.boxShadow = "0 0 0 4px rgba(255,81,47,0.1)"; }}
                    onBlur={(e)  => { e.target.style.boxShadow = ""; }}
                  />
                </div>

                {/* Role toggle */}
                <div>
                  <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => {
                      const active = role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`flex items-center gap-[9px] rounded-[11px] border-[1.5px] px-[11px] py-[10px] text-[12.5px] font-semibold transition-colors text-left ${
                            active
                              ? "border-amer-700 bg-primary-bg text-amer-600"
                              : "border-line bg-surface text-text hover:border-muted-2"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[7px] transition-colors ${
                              active
                                ? "bg-primary-bg text-amer-600"
                                : "bg-bg-card text-muted"
                            }`}
                          >
                            {r.icon}
                          </span>
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hidden permission inputs (always present so server action can read them) */}
                {PERM_META.map(({ key }) => (
                  <input key={key} type="hidden" name={key} value={perms[key] ? "true" : "false"} />
                ))}

                {/* Permissions (admin only — super_admin has full access) */}
                {role === "admin" && (
                  <div>
                    <label className="mb-[7px] block text-[12.5px] font-semibold text-ink">
                      Permissions
                    </label>
                    <div className="overflow-hidden rounded-[13px] border-[1.5px] border-line">
                      {PERM_META.map(({ key, label, sub }, i) => (
                        <div
                          key={key}
                          className={`flex items-center gap-4 px-[14px] py-[13px] ${
                            i < PERM_META.length - 1 ? "border-b border-line-2" : ""
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <b className="block text-[13px] font-semibold text-ink">{label}</b>
                            <span className="text-[11.5px] text-muted">{sub}</span>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={perms[key]}
                            onClick={() => togglePerm(key)}
                            className={`relative h-[27px] w-[46px] flex-shrink-0 rounded-full transition-colors ${
                              perms[key] ? "bg-amer-700" : "bg-line"
                            }`}
                          >
                            <span
                              className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow-sm transition-all ${
                                perms[key] ? "left-[22px]" : "left-[3px]"
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {state?.error && (
                  <p className="rounded-[11px] bg-[#FBE9E7] px-3 py-2 text-[13px] font-medium text-[#B53224]">
                    {state.error}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-[10px] px-[22px] pb-[22px]">
                <button
                  type="button"
                  onClick={close}
                  className="flex h-[38px] items-center rounded-[11px] border-[1.5px] border-line bg-surface px-[14px] text-[13px] font-semibold text-ink transition-colors hover:border-muted-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex h-[38px] items-center gap-2 rounded-[11px] bg-amer-700 px-[14px] text-[13px] font-semibold text-white transition-colors hover:bg-amer-600 disabled:opacity-50"
                  style={{ boxShadow: "var(--shadow-primary)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  {pending ? "Creating…" : "Create account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes rise { to { transform: translateY(0); } }
      `}</style>
    </>
  );
}
