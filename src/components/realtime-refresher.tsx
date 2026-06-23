"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Watch {
  table: string;
  events?: ("INSERT" | "UPDATE" | "DELETE")[];
}

export function RealtimeRefresher({ watches }: { watches: Watch[] }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channels = watches.map(({ table, events = ["INSERT", "UPDATE"] }, i) => {
      let ch = supabase.channel(`rt-refresh-${table}-${i}`);
      events.forEach((event) => {
        ch = ch.on(
          "postgres_changes" as Parameters<typeof ch.on>[0],
          { event, schema: "public", table },
          () => router.refresh()
        );
      });
      return ch.subscribe();
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
