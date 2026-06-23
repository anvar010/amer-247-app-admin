"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateDocStatus(
  docId: string,
  status: string,
  rejectionReason: string | null,
  userId: string,
) {
  // Verify caller is an admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { error: "Access denied" };
  }

  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("user_documents")
    .update({
      status,
      rejection_reason: status === "rejected" ? rejectionReason : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", docId);

  if (error) return { error: error.message };

  revalidatePath(`/users/${userId}`);
  return { success: true };
}
