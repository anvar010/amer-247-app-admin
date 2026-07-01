"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/supabase/session";

export async function leaveApplicationAction(applicationId: string) {
  const { user } = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();

  // Verify this user is actually assigned before leaving
  const { data: app } = await admin
    .from("applications")
    .select("assigned_to")
    .eq("id", applicationId)
    .single();

  if (!app || app.assigned_to !== user.id) {
    throw new Error("You are not assigned to this application");
  }

  await Promise.all([
    admin.from("profiles").update({ staff_status: "free" }).eq("id", user.id),
    admin.from("applications")
      .update({ assigned_to: null, assignment_status: null })
      .eq("id", applicationId),
    admin.from("application_activity").insert({
      application_id: applicationId,
      user_id: user.id,
      type: "assignment",
      message: "Left the application",
    }),
  ]);
}
