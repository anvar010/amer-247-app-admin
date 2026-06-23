"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };
  return (
    <button
      onClick={signOut}
      className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-text transition hover:border-amer-700 hover:text-amer-700"
    >
      Sign out
    </button>
  );
}
