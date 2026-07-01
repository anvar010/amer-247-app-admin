"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function createStaffMember(_prev: { error?: string; success?: boolean } | null, formData: FormData) {
  const email    = (formData.get("email")     as string).trim();
  const password = (formData.get("password")  as string);
  const fullName = (formData.get("full_name") as string).trim();
  const role     = (formData.get("role")      as "admin" | "super_admin") ?? "admin";

  if (!email || !password || !fullName) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data: { user: creator } } = await supabase.auth.getUser();
  if (!creator) return { error: "Unauthorized." };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", creator.id)
    .single();
  if (callerProfile?.role !== "super_admin") return { error: "Only super admins can create staff members." };

  const adminClient = createAdminClient();

  // 1. Create the auth user (bypasses email confirmation)
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) return { error: error.message };

  const newUserId = data.user.id;

  // 2. Update the auto-created profile with the correct role and name
  await adminClient
    .from("profiles")
    .update({ role, full_name: fullName })
    .eq("id", newUserId);

  // 3. Save to the staff registry table
  const { error: staffError } = await adminClient
    .from("staff")
    .insert({
      user_id:    newUserId,
      full_name:  fullName,
      email,
      role,
      created_by: creator?.id ?? null,
    });

  if (staffError) {
    // Non-fatal: user was created, staff registry insert failed
    console.error("staff insert failed:", staffError.message);
  }

  // 4. Insert admin_permissions row for regular admins
  if (role === "admin") {
    await adminClient.from("admin_permissions").insert({
      user_id:                        newUserId,
      can_view_all_applications:      formData.get("can_view_all_applications")      === "true",
      can_change_application_status:  formData.get("can_change_application_status")  === "true",
      can_manage_documents:           formData.get("can_manage_documents")           === "true",
      can_send_notifications:         formData.get("can_send_notifications")         === "true",
    });
  }

  revalidatePath("/staff");
  return { success: true };
}
