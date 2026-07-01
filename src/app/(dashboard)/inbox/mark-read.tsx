"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MarkInboxRead({ userId }: { userId: string }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const markAll = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={markAll}
      disabled={saving}
      className="rounded-[9px] border border-line bg-surface px-[14px] py-[7px] text-[12.5px] font-semibold text-muted transition-colors hover:border-muted-2 hover:text-ink disabled:opacity-50"
    >
      {saving ? "Marking…" : "Mark all read"}
    </button>
  );
}
