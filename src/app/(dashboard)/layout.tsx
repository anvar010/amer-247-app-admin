import { getSessionUser } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SidebarNav } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSessionUser();

  const displayName = profile?.full_name || user?.email || "Admin";
  const userRole    = profile?.role ?? "admin";
  const isSuperAdmin = profile?.role === "super_admin";

  const admin = createAdminClient();
  const [{ count: newApps }, { count: pendingDocs }, { count: inboxUnread }] = await Promise.all([
    admin.from("applications").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    admin.from("user_documents").select("*", { count: "exact", head: true }).eq("status", "pending"),
    user
      ? admin.from("admin_notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false)
      : Promise.resolve({ count: 0 }),
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
          badges={{ "/applications": newApps ?? 0, "/documents": pendingDocs ?? 0, "/inbox": inboxUnread ?? 0 }}
        />
      </aside>

      <div className="flex flex-col overflow-hidden">
        <div className="relative z-20 flex-shrink-0">
          <Topbar notifCount={inboxUnread ?? 0} />
        </div>
        <main className="flex-1 overflow-y-auto bg-bg p-7">{children}</main>
      </div>
    </div>
  );
}
