import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SidebarNav } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = user?.email ?? "Admin";
  let isSuperAdmin = false;
  let userRole = "admin";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    displayName = profile?.full_name || user.email || "Admin";
    userRole    = profile?.role ?? "admin";
    isSuperAdmin = profile?.role === "super_admin";
  }

  // Badge counts: submitted applications + pending user documents
  const admin = createAdminClient();
  const [{ count: newApps }, { count: pendingDocs }] = await Promise.all([
    admin.from("applications").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    admin.from("user_documents").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <div
      className="h-screen overflow-hidden"
      style={{ display: "grid", gridTemplateColumns: "256px 1fr" }}
    >
      <aside
        className="relative flex flex-shrink-0 flex-col overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #7A1508 0%, #4A1808 60%, #1A0A05 100%)",
        }}
      >
        <SidebarNav
          isSuperAdmin={isSuperAdmin}
          displayName={displayName}
          userRole={userRole}
          badges={{ "/applications": newApps ?? 0, "/documents": pendingDocs ?? 0 }}
        />
      </aside>

      <div className="flex flex-col overflow-hidden">
        <Topbar notifCount={(newApps ?? 0) + (pendingDocs ?? 0)} />
        <main className="flex-1 overflow-y-auto bg-bg p-7">{children}</main>
      </div>
    </div>
  );
}
