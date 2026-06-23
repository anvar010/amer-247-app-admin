"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Role = "user" | "admin" | "super_admin";

const ROLE_STYLES: Record<Role, string> = {
  user:        "border-line bg-surface text-ink",
  admin:       "border-gold bg-gold-bg text-gold-fg",
  super_admin: "border-amer-700 bg-amer-50 text-amer-700",
};

export function RoleSelect({
  userId,
  role,
  currentUserRole,
}: {
  userId: string;
  role: string;
  currentUserRole: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(role as Role);
  const [saving, setSaving] = useState(false);

  const onChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as Role;
    setValue(next);
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ role: next }).eq("id", userId);
    setSaving(false);
    router.refresh();
  };

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={saving}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none disabled:opacity-50 ${
        ROLE_STYLES[value] ?? ROLE_STYLES.user
      }`}
    >
      <option value="user">user</option>
      <option value="admin">admin</option>
      {currentUserRole === "super_admin" && (
        <option value="super_admin">super admin</option>
      )}
    </select>
  );
}
