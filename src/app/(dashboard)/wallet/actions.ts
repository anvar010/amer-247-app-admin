"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Update welcome bonus & max cap ──────────────────────────────────────────
export async function updateWalletConfig(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const bonus = parseFloat(formData.get("welcome_bonus") as string);
  const cap   = parseFloat(formData.get("max_per_service") as string);

  if (isNaN(bonus) || bonus < 0) return { error: "Enter a valid welcome bonus amount." };
  if (isNaN(cap)   || cap < 0)   return { error: "Enter a valid max-per-service amount." };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const [r1, r2] = await Promise.all([
    supabase.from("app_config").update({ value: { amount: bonus }, updated_at: now }).eq("key", "welcome_bonus"),
    supabase.from("app_config").update({ value: { amount: cap },   updated_at: now }).eq("key", "max_credit_per_service"),
  ]);

  if (r1.error) return { error: r1.error.message };
  if (r2.error) return { error: r2.error.message };

  revalidatePath("/wallet");
  return { success: true };
}

// ── Bonus cashback config ────────────────────────────────────────────────────
export async function updateCashbackConfig(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const cbType  = (formData.get("cashback_type") as string | null) ?? "amount";
  const cbValue = parseFloat(formData.get("cashback_value") as string);

  if (isNaN(cbValue) || cbValue < 0)              return { error: "Enter a valid cashback value." };
  if (cbType === "percentage" && cbValue > 100)    return { error: "Percentage cannot exceed 100%." };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const [r1, r2] = await Promise.all([
    supabase.from("app_config").upsert({ key: "cashback_type",  value: { type: cbType },     label: "Cashback type (amount / percentage)", updated_at: now }),
    supabase.from("app_config").upsert({ key: "cashback_value", value: { amount: cbValue },  label: "Cashback value (AED or %, 0 = disabled)", updated_at: now }),
  ]);

  if (r1.error) return { error: r1.error.message };
  if (r2.error) return { error: r2.error.message };

  revalidatePath("/wallet");
  return { success: true };
}

// ── Per-service cashback rules ───────────────────────────────────────────────
export async function upsertCashbackRule(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const serviceName = (formData.get("service_name") as string).trim();
  const cbType      = (formData.get("cashback_type") as string) ?? "amount";
  const cbValue     = parseFloat(formData.get("cashback_value") as string);

  if (!serviceName)              return { error: "Enter a service name." };
  if (isNaN(cbValue) || cbValue < 0) return { error: "Enter a valid cashback value." };
  if (cbType === "percentage" && cbValue > 100) return { error: "Percentage cannot exceed 100%." };

  const supabase = await createClient();
  const { error } = await supabase.from("cashback_rules").upsert(
    { service_name: serviceName, cashback_type: cbType, cashback_value: cbValue, enabled: true },
    { onConflict: "service_name" }
  );

  if (error) return { error: error.message };
  revalidatePath("/wallet");
  return { success: true };
}

export async function deleteCashbackRule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cashback_rules").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/wallet");
  return { success: true };
}

export async function toggleCashbackRule(id: string, enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("cashback_rules").update({ enabled }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/wallet");
  return { success: true };
}

// ── Push promo bonus ─────────────────────────────────────────────────────────
export async function pushPromoBonus(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
) {
  const amount  = parseFloat(formData.get("amount") as string);
  const desc    = (formData.get("description") as string).trim();
  const target  = formData.get("target") as "all" | "one";
  const userId  = (formData.get("user_id") as string | null)?.trim() || null;

  if (isNaN(amount) || amount <= 0) return { error: "Enter a valid bonus amount (> 0)." };
  if (!desc)                        return { error: "Enter a description." };
  if (target === "one" && !userId)  return { error: "Enter the target user ID." };

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_grant_bonus", {
    p_amount:      amount,
    p_description: desc,
    p_user_id:     target === "one" ? userId : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/wallet");
  return { success: `Bonus of AED ${amount.toFixed(2)} credited to ${data} wallet${data !== 1 ? "s" : ""}.` };
}
