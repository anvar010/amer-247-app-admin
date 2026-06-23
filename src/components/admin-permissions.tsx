"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PermKey =
  | "can_change_application_status"
  | "can_view_all_applications"
  | "can_manage_documents"
  | "can_send_notifications";

interface Permissions {
  id?: string;
  can_change_application_status: boolean;
  can_view_all_applications: boolean;
  can_manage_documents: boolean;
  can_send_notifications: boolean;
}

const PERM_META: { key: PermKey; label: string; sub: string }[] = [
  { key: "can_view_all_applications",     label: "View all applications",     sub: "Access the full applications list" },
  { key: "can_change_application_status", label: "Change application status", sub: "Approve, reject or update any application" },
  { key: "can_manage_documents",          label: "Manage documents",          sub: "Verify or reject uploaded documents" },
  { key: "can_send_notifications",        label: "Send notifications",        sub: "Broadcast push & email to applicants" },
];

const DEFAULT: Permissions = {
  can_change_application_status: false,
  can_view_all_applications: false,
  can_manage_documents: false,
  can_send_notifications: false,
};

export function AdminPermissions({
  userId,
  initialPermissions,
}: {
  userId: string;
  initialPermissions: Permissions | null;
}) {
  const [perms, setPerms] = useState<Permissions>(initialPermissions ?? DEFAULT);
  const [permId, setPermId] = useState<string | undefined>(initialPermissions?.id);
  const [saving, setSaving] = useState<PermKey | null>(null);

  const toggle = async (key: PermKey) => {
    const newValue = !perms[key];
    setPerms((p) => ({ ...p, [key]: newValue }));
    setSaving(key);

    const supabase = createClient();
    const payload = { [key]: newValue, updated_at: new Date().toISOString() };

    if (permId) {
      await supabase.from("admin_permissions").update(payload).eq("id", permId);
    } else {
      const { data } = await supabase
        .from("admin_permissions")
        .insert({ user_id: userId, ...DEFAULT, [key]: newValue })
        .select("id")
        .single();
      if (data) setPermId((data as { id: string }).id);
    }

    setSaving(null);
  };

  return (
    <div
      className="overflow-hidden rounded-[var(--r-lg)] border border-line bg-surface"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="border-b border-line px-[22px] py-[18px]">
        <h2
          className="text-[16px] font-bold text-ink"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          Admin permissions
        </h2>
        <p className="mt-[3px] text-[13px] text-muted">
          Control what this admin can do in the dashboard.
        </p>
      </div>

      <div className="px-[22px] py-[6px]">
        {PERM_META.map(({ key, label, sub }, i) => {
          const enabled = perms[key];
          const busy = saving === key;
          return (
            <div
              key={key}
              className={`flex items-center gap-4 py-[14px] ${i < PERM_META.length - 1 ? "border-b border-line-2" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-ink">{label}</p>
                <p className="text-[12px] text-muted">{sub}</p>
              </div>
              <button
                role="switch"
                aria-checked={enabled}
                disabled={busy}
                onClick={() => toggle(key)}
                className={`relative h-[27px] w-[46px] flex-shrink-0 rounded-full transition-colors focus:outline-none disabled:opacity-40 ${
                  enabled ? "bg-amer-700" : "bg-line"
                }`}
              >
                <span
                  className={`absolute top-[3px] h-[21px] w-[21px] rounded-full bg-white shadow-sm transition-all ${
                    enabled ? "left-[22px]" : "left-[3px]"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
