import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserDocStatus } from "@/components/user-doc-status";
import { AdminPermissions } from "@/components/admin-permissions";

const APP_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  submitted: { bg: "rgba(42,91,158,0.12)",  color: "#2A5B9E", label: "Submitted" },
  in_review: { bg: "rgba(226,64,32,0.12)",  color: "#E24020", label: "In Review" },
  scheduled: { bg: "rgba(13,107,102,0.12)", color: "#0D6B66", label: "Scheduled" },
  approved:  { bg: "rgba(13,107,102,0.12)", color: "#0D6B66", label: "Approved"  },
  rejected:  { bg: "rgba(181,50,36,0.12)",  color: "#B53224", label: "Rejected"  },
};

const DOC_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "rgba(201,162,75,0.18)",  color: "#A6822F", label: "Pending"   },
  in_review: { bg: "rgba(42,91,158,0.12)",   color: "#2A5B9E", label: "In Review" },
  approved:  { bg: "rgba(13,107,102,0.12)",  color: "#0D6B66", label: "Approved"  },
  rejected:  { bg: "rgba(181,50,36,0.12)",   color: "#B53224", label: "Rejected"  },
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const cardCls   = "rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden";
const cardShadow = { boxShadow: "var(--shadow-card)" };

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from("profiles").select("role").eq("id", currentUser!.id).single();
  const isSuperAdmin = currentProfile?.role === "super_admin";

  let canManageDocs = isSuperAdmin;
  if (!isSuperAdmin && currentProfile?.role === "admin") {
    const { data: myPerms } = await supabase
      .from("admin_permissions")
      .select("can_manage_documents")
      .eq("user_id", currentUser!.id)
      .maybeSingle();
    canManageDocs = !!(myPerms as { can_manage_documents?: boolean } | null)?.can_manage_documents;
  }

  const adminClient = createAdminClient();

  const { data: profile } = await adminClient.from("profiles").select("*").eq("id", id).single();
  if (!profile) notFound();

  const isStaff = profile.role === "admin" || profile.role === "super_admin";

  // Fetch in parallel: applications + documents + permissions
  const [{ data: userApps }, { data: userDocs }, { data: permRow }] = await Promise.all([
    adminClient
      .from("applications")
      .select("id, ref, service_name, status, fee, created_at, hub_title, location")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    !isStaff && canManageDocs
      ? adminClient.from("user_documents").select("*").eq("user_id", id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    isStaff && isSuperAdmin && profile.role === "admin"
      ? adminClient.from("admin_permissions").select("*").eq("user_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Signed URLs for documents
  type DocRow = { id: string; doc_type: string; file_name: string; file_path: string; size_bytes: number | null; status: string; rejection_reason: string | null; created_at: string };
  const docsWithUrls: (DocRow & { url: string | null })[] = await Promise.all(
    (userDocs as DocRow[] || []).map(async (d) => {
      const { data } = await adminClient.storage.from("documents").createSignedUrl(d.file_path, 60 * 10);
      return { ...d, url: data?.signedUrl ?? null };
    })
  );

  const ini = initials(profile.full_name || profile.email || "?");
  const apps = userApps || [];

  const ROLE_PILL: Record<string, { bg: string; color: string; label: string }> = {
    super_admin: { bg: "rgba(27,163,156,0.13)", color: "#0D6B66",       label: "Super Admin" },
    admin:       { bg: "rgba(226,64,32,0.12)",  color: "#E24020",       label: "Admin"       },
    user:        { bg: "rgba(0,0,0,0.06)",       color: "var(--muted)", label: "User"        },
  };
  const rolePill = ROLE_PILL[profile.role] ?? ROLE_PILL.user;

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <Link href="/users" className="hover:text-ink transition-colors">Users</Link>
        <span>/</span>
        <span className="text-ink font-medium">{profile.full_name || profile.email || "User"}</span>
      </div>

      {/* Hero card */}
      <div className={cardCls} style={cardShadow}>
        <div className="flex items-center gap-5 px-[26px] py-[22px]">
          {/* Avatar */}
          <div
            className="flex h-[62px] w-[62px] flex-shrink-0 items-center justify-center rounded-[18px] text-[22px] font-extrabold text-white"
            style={{ background: "linear-gradient(155deg,#E24020,#7A1508)", fontFamily: "var(--font-outfit)" }}
          >
            {ini}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-[20px] font-extrabold tracking-tight text-ink"
                style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
              >
                {profile.full_name || "—"}
              </h1>
              <span
                className="inline-flex items-center rounded-full px-[10px] py-[3px] text-[11px] font-bold"
                style={{ background: rolePill.bg, color: rolePill.color }}
              >
                {rolePill.label}
              </span>
            </div>
            <div className="mt-[4px] flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
              {profile.email && <span>{profile.email}</span>}
              {profile.mobile && <span>{profile.mobile}</span>}
              <span>Joined {fmt(profile.created_at)}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-[28px] flex-shrink-0">
            <div className="text-center">
              <div className="text-[22px] font-extrabold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                {apps.length}
              </div>
              <div className="text-[11.5px] text-muted">Applications</div>
            </div>
            <div className="h-8 w-px bg-line" />
            <div className="text-center">
              <div className="text-[22px] font-extrabold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                {docsWithUrls.length}
              </div>
              <div className="text-[11.5px] text-muted">Documents</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_290px]">

        {/* LEFT — Applications + Documents */}
        <div className="flex flex-col gap-5">

          {/* Applications */}
          <div className={cardCls} style={cardShadow}>
            <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
              <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                Applications
              </h3>
              <span className="ml-auto rounded-full bg-bg-card px-3 py-[3px] text-[11px] font-semibold text-muted">
                {apps.length} total
              </span>
            </div>

            {apps.length === 0 ? (
              <div className="px-[22px] py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-bg-card text-muted-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>
                  </svg>
                </div>
                <p className="text-[13px] text-muted">No applications yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-line-2">
                      {["Reference", "Service", "Fee", "Submitted", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-muted-2 first:pl-[22px] last:pr-[22px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => {
                      const st = APP_STATUS[app.status] ?? { bg: "var(--bg-card)", color: "var(--muted)", label: app.status };
                      return (
                        <tr key={app.id} className="border-b border-line-2 transition-colors last:border-none hover:bg-bg-card">
                          <td className="py-[13px] pl-[22px] pr-4">
                            <Link
                              href={`/applications/${app.id}`}
                              className="text-[12.5px] font-bold text-ink hover:text-amer-700"
                              style={{ fontFamily: "var(--font-outfit)" }}
                            >
                              {app.ref}
                            </Link>
                          </td>
                          <td className="px-4 py-[13px]">
                            <div className="text-[13px] font-medium text-ink">{app.service_name}</div>
                            {app.hub_title && (
                              <div className="mt-[2px] text-[11.5px] text-muted-2">{app.hub_title}</div>
                            )}
                          </td>
                          <td className="px-4 py-[13px] text-[13px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                            {app.fee != null ? `AED ${app.fee}` : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-[13px] text-[13px] text-muted">
                            {fmt(app.created_at)}
                          </td>
                          <td className="py-[13px] pl-4 pr-[22px]">
                            <span
                              className="inline-flex items-center rounded-full px-[10px] py-[4px] text-[11.5px] font-bold"
                              style={{ background: st.bg, color: st.color }}
                            >
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Documents (only for app users with permission) */}
          {!isStaff && canManageDocs && (
            <div className={cardCls} style={cardShadow}>
              <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
                <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                  Documents
                </h3>
                <span className="ml-auto rounded-full bg-bg-card px-3 py-[3px] text-[11px] font-semibold text-muted">
                  {docsWithUrls.length} uploaded
                </span>
              </div>

              {docsWithUrls.length === 0 ? (
                <div className="px-[22px] py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-bg-card text-muted-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                    </svg>
                  </div>
                  <p className="text-[13px] text-muted">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-line-2">
                  {docsWithUrls.map((doc) => {
                    const ds = DOC_STATUS[doc.status] ?? { bg: "var(--bg-card)", color: "var(--muted)", label: doc.status };
                    const docLabel = doc.doc_type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                    return (
                      <div key={doc.id} className="px-[22px] py-[15px]">
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-bg-card text-muted-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                            </svg>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-semibold text-ink">{docLabel}</p>
                            <p className="mt-[2px] truncate text-[12px] text-muted-2">
                              {doc.file_name}
                              {doc.size_bytes ? ` · ${(doc.size_bytes / 1024 / 1024).toFixed(1)} MB` : ""}
                            </p>
                          </div>

                          {/* Status pill */}
                          <span
                            className="inline-flex flex-shrink-0 items-center rounded-full px-[10px] py-[4px] text-[11.5px] font-bold"
                            style={{ background: ds.bg, color: ds.color }}
                          >
                            {ds.label}
                          </span>

                          {/* Actions */}
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <UserDocStatus
                              docId={doc.id}
                              status={doc.status as "pending" | "in_review" | "approved" | "rejected"}
                              rejectionReason={doc.rejection_reason}
                              userId={id}
                            />
                            {doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-8 items-center rounded-[9px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-muted-2"
                              >
                                View
                              </a>
                            )}
                          </div>
                        </div>

                        {doc.status === "rejected" && doc.rejection_reason && (
                          <div
                            className="mt-[10px] rounded-[10px] px-[13px] py-[9px]"
                            style={{ background: "rgba(181,50,36,0.07)" }}
                          >
                            <p className="text-[11.5px] font-semibold" style={{ color: "#B53224" }}>Rejection reason</p>
                            <p className="mt-[2px] text-[12px]" style={{ color: "#B53224" }}>{doc.rejection_reason}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Profile details + Permissions */}
        <div className="flex flex-col gap-5">

          {/* Profile details */}
          <div className={cardCls} style={cardShadow}>
            <div className="border-b border-line px-[22px] py-[18px]">
              <h3 className="text-[16px] font-bold text-ink" style={{ fontFamily: "var(--font-outfit)" }}>
                Profile
              </h3>
            </div>
            <div className="flex flex-col gap-0 divide-y divide-line-2">
              {[
                { label: "Full name",    value: profile.full_name },
                { label: "Email",        value: profile.email },
                { label: "Mobile",       value: profile.mobile },
                { label: "Nationality",  value: profile.nationality },
                { label: "Date of birth",value: profile.date_of_birth ? fmt(profile.date_of_birth) : null },
                { label: "Gender",       value: profile.gender },
                { label: "Emirates ID",  value: profile.emirates_id },
                { label: "Joined",       value: fmt(profile.created_at) },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex items-start justify-between gap-3 px-[22px] py-[11px]">
                  <span className="text-[12.5px] text-muted flex-shrink-0">{label}</span>
                  <span className="text-[12.5px] font-medium text-ink text-right">{value}</span>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Admin permissions (super admin viewing an admin) */}
          {isSuperAdmin && profile.role === "admin" && (
            <AdminPermissions
              userId={id}
              initialPermissions={permRow as {
                id: string;
                can_change_application_status: boolean;
                can_view_all_applications: boolean;
                can_manage_documents: boolean;
                can_send_notifications: boolean;
              } | null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
