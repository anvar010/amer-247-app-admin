"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Audience = "all" | "submitted" | "in_review" | "scheduled" | "approved" | "rejected";

async function getTokensForAudience(audience: Audience): Promise<string[]> {
  const admin = createAdminClient();

  if (audience === "all") {
    // No role filter — send to everyone with a push token (users + admins testing)
    const { data } = await admin
      .from("profiles")
      .select("expo_push_token")
      .not("expo_push_token", "is", null);
    return (data || []).map((r) => r.expo_push_token as string).filter(Boolean);
  }

  // Filter by application status → get user IDs → get their tokens
  const { data: apps } = await admin
    .from("applications")
    .select("user_id")
    .eq("status", audience);
  const userIds = Array.from(new Set((apps || []).map((a) => a.user_id).filter(Boolean)));
  if (!userIds.length) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("expo_push_token")
    .in("id", userIds)
    .not("expo_push_token", "is", null);
  return (profiles || []).map((r) => r.expo_push_token as string).filter(Boolean);
}

type ExpoResult = { status: "ok" | "error"; message?: string; details?: { error?: string } };

async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
): Promise<{ ok: number; firstError: string | null }> {
  if (!tokens.length) return { ok: 0, firstError: "No push tokens found for this audience" };

  const messages = tokens.map((to) => ({ to, title, body, sound: "default" }));
  let ok = 0;
  let firstError: string | null = null;

  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res  = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      });
      const json = await res.json() as { data?: ExpoResult[]; errors?: { code: string; message: string }[] };


      if (json.data) {
        for (const r of json.data) {
          if (r.status === "ok") {
            ok++;
          } else if (!firstError) {
            firstError = r.details?.error ?? r.message ?? "Expo push error";
          }
        }
      }
      if (json.errors?.length && !firstError) {
        firstError = json.errors[0].message;
      }
    } catch (e) {
      if (!firstError) firstError = (e as Error).message;
    }
  }

  return { ok, firstError };
}

export async function getAudienceTokenCount(audience: string): Promise<number> {
  try {
    const tokens = await getTokensForAudience(audience as Audience);
    return tokens.length;
  } catch {
    return 0;
  }
}

export async function saveDraft(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const title    = (formData.get("title")    as string | null)?.trim() ?? "";
  const message  = (formData.get("message")  as string | null)?.trim() ?? "";
  const audience = (formData.get("audience") as string | null) ?? "all";
  const channel  = (formData.get("channel")  as string | null) ?? "push";

  if (!title || !message) throw new Error("Title and message are required");

  await admin.from("broadcasts").insert({
    title,
    message,
    audience,
    channel,
    status: "draft",
    created_by: user?.id ?? null,
  });

  revalidatePath("/notifications");
}

export async function sendBroadcast(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const title    = (formData.get("title")    as string | null)?.trim() ?? "";
  const message  = (formData.get("message")  as string | null)?.trim() ?? "";
  const audience = ((formData.get("audience") as string | null) ?? "all") as Audience;
  const channel  = (formData.get("channel")  as string | null) ?? "push";

  if (!title || !message) throw new Error("Title and message are required");

  const tokens = await getTokensForAudience(audience);
  const { ok: reach, firstError } = await sendExpoPush(tokens, title, message);

  await admin.from("broadcasts").insert({
    title,
    message,
    audience,
    channel,
    status: "sent",
    reach,
    sent_at: new Date().toISOString(),
    created_by: user?.id ?? null,
  });

  revalidatePath("/notifications");

  if (reach === 0 && firstError) {
    throw new Error(`Sent but 0 delivered. Expo error: ${firstError}`);
  }
}

export async function sendDraft(broadcastId: string) {
  const admin = createAdminClient();
  const { data: bc } = await admin
    .from("broadcasts")
    .select("*")
    .eq("id", broadcastId)
    .single();
  if (!bc) throw new Error("Broadcast not found");

  const tokens = await getTokensForAudience(bc.audience as Audience);
  const { ok: reach, firstError } = await sendExpoPush(tokens, bc.title, bc.message);

  await admin.from("broadcasts").update({
    status: "sent",
    reach,
    sent_at: new Date().toISOString(),
  }).eq("id", broadcastId);

  const draftError = reach === 0 ? firstError : null;
  revalidatePath("/notifications");
  if (draftError) throw new Error(`Sent but 0 delivered. Expo error: ${draftError}`);
}

export async function deleteBroadcast(broadcastId: string) {
  const admin = createAdminClient();
  await admin.from("broadcasts").delete().eq("id", broadcastId);
  revalidatePath("/notifications");
}
