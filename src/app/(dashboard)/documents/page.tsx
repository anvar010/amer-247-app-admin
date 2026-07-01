import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { DocActions } from "./doc-actions";

const DOC_TYPE_LABEL: Record<string, string> = {
  passport:       "Passport",
  emirates_id:    "Emirates ID",
  photograph:     "Photograph",
  medical_report: "Medical Report",
  visa:           "Visa",
  other:          "Other",
};

const FILTERS = ["All", "Pending", "In_review", "Approved", "Rejected"] as const;
type Filter = (typeof FILTERS)[number];

const STATE_TAG: Record<string, { bg: string; color: string; icon: "check" | "x" | null }> = {
  Approved:  { bg: "rgba(27,163,156,0.13)", color: "#0D6B66", icon: "check" },
  In_review: { bg: "rgba(255,81,47,0.10)",  color: "#E24020", icon: null },
  Pending:   { bg: "rgba(201,162,75,0.18)", color: "#A6822F", icon: null },
  Rejected:  { bg: "#FBE9E7",               color: "#B53224", icon: "x"   },
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const activeFilter: Filter = (FILTERS as readonly string[]).includes(filterParam ?? "")
    ? (filterParam as Filter)
    : "All";

  const { user, profile, supabase } = await getSessionUser();
  const adminClient = createAdminClient();

  const isSuperAdmin = profile?.role === "super_admin";

  let canManageDocs = isSuperAdmin;
  if (!isSuperAdmin && profile?.role === "admin") {
    const { data: perms } = await supabase
      .from("admin_permissions")
      .select("can_manage_documents")
      .eq("user_id", user!.id)
      .maybeSingle();
    canManageDocs = !!(perms as { can_manage_documents?: boolean } | null)?.can_manage_documents;
  }
  if (!canManageDocs) redirect("/unauthorized");

  // Fetch all user documents
  const docsQuery = adminClient
    .from("user_documents")
    .select("*")
    .order("created_at", { ascending: false });

  const filterValue = activeFilter === "In_review" ? "in_review" : activeFilter.toLowerCase();
  const { data: allDocs } = activeFilter === "All"
    ? await docsQuery
    : await docsQuery.eq("status", filterValue);

  // Status counts
  const { data: countRows } = await adminClient.from("user_documents").select("status");
  const counts: Record<string, number> = {};
  (countRows || []).forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
  const totalCount = (countRows || []).length;

  // Fetch profiles for all users with docs
  const userIds = Array.from(new Set((allDocs || []).map((d) => d.user_id)));
  const { data: profiles } = userIds.length
    ? await adminClient.from("profiles").select("id, full_name, email, nationality").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null; nationality: string | null }[] };
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Generate signed URLs
  const docsWithUrls = await Promise.all(
    (allDocs || []).map(async (doc) => {
      const { data: signed } = await adminClient.storage
        .from("documents")
        .createSignedUrl(doc.file_path, 60 * 10);
      return { ...doc, url: signed?.signedUrl ?? null };
    })
  );

  // Group by user
  type DocRow = (typeof docsWithUrls)[number];
  const groups: { userId: string; profile: { id: string; full_name: string | null; email: string | null; nationality: string | null } | undefined; docs: DocRow[] }[] = [];
  docsWithUrls.forEach((doc) => {
    const g = groups.find((x) => x.userId === doc.user_id);
    if (g) {
      g.docs.push(doc);
    } else {
      groups.push({ userId: doc.user_id, profile: profileMap.get(doc.user_id), docs: [doc] });
    }
  });

  const cardCls = "rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden";
  const cardShadow = { boxShadow: "var(--shadow-card)" };

  const filterCount = (f: Filter) => f === "All" ? totalCount : (counts[f.toLowerCase()] ?? 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2
          className="text-[19px] font-extrabold tracking-tight text-ink"
          style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
        >
          Documents
        </h2>
        <p className="mt-[3px] text-[13px] text-muted">
          Uploads from Account → Documents in the app, grouped by applicant
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = activeFilter === f;
          return (
            <Link
              key={f}
              href={f === "All" ? "/documents" : `/documents?filter=${f}`}
              className={`inline-flex items-center gap-[7px] rounded-full border px-[14px] py-[7px] text-[12.5px] font-semibold transition-colors ${
                active
                  ? "border-amer-700 bg-amer-700 text-white"
                  : "border-line bg-surface text-muted hover:border-muted-2 hover:text-ink"
              }`}
            >
              {f}
              <span
                className={`min-w-[18px] rounded-full px-1 py-0 text-center text-[10px] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-bg-card text-muted-2"
                }`}
              >
                {filterCount(f)}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Grouped document cards */}
      {groups.length === 0 ? (
        <div className={`${cardCls} py-16 text-center`} style={cardShadow}>
          <div className="mx-auto mb-[14px] flex h-14 w-14 items-center justify-center rounded-[16px] bg-bg-card text-muted-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p className="text-[13.5px] text-muted">No documents found.</p>
        </div>
      ) : (
        groups.map((group) => {
          const profile = group.profile;
          const verified = group.docs.filter((d) => d.status === "approved").length;
          const pending  = group.docs.filter((d) => d.status === "pending").length;
          const ini = initials(profile?.full_name || profile?.email || "?");

          return (
            <div key={group.userId} className={cardCls} style={cardShadow}>
              {/* Group head */}
              <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-bg-card text-[14px] font-bold text-amer-700">
                  {ini}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink">{profile?.full_name || "—"}</p>
                  <p className="text-[11.5px] text-muted-2">
                    {profile?.nationality || "—"}
                    {profile?.email ? ` · ${profile.email}` : ""}
                    {` · ${group.docs.length} document${group.docs.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-bg-card px-[10px] py-[3px] text-[11px] font-semibold text-muted">
                    {verified}/{group.docs.length} verified
                  </span>
                  {pending > 0 && (
                    <span className="rounded-full px-[10px] py-[3px] text-[11px] font-semibold" style={{ background: "rgba(201,162,75,0.18)", color: "#A6822F" }}>
                      {pending} pending
                    </span>
                  )}
                  <Link
                    href={`/users/${group.userId}`}
                    className="flex h-8 items-center rounded-[9px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-muted-2"
                  >
                    View user
                  </Link>
                </div>
              </div>

              {/* Doc rows */}
              {group.docs.map((doc, i) => {
                const statusKey = (doc.status as string).charAt(0).toUpperCase() + (doc.status as string).slice(1);
                const tag = STATE_TAG[statusKey] ?? { bg: "var(--bg-card)", color: "var(--muted)", icon: null };
                const typeLabel = DOC_TYPE_LABEL[doc.doc_type as string] ?? (doc.doc_type as string);

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-[13px] px-[16px] py-[13px] ${i < group.docs.length - 1 ? "border-b border-line-2" : ""}`}
                  >
                    {/* Icon */}
                    <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-bg-card text-amer-700">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>

                    {/* Body */}
                    <div className="min-w-0 flex-1">
                      <b className="block text-[13.5px] font-semibold text-ink">{typeLabel}</b>
                      <span className="text-[12px] text-muted">
                        {doc.file_name as string}
                        {doc.size_bytes ? ` · ${Math.round((doc.size_bytes as number) / 1024)} KB` : ""}
                        {` · ${new Date(doc.created_at as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
                      </span>
                      {doc.status === "rejected" && doc.rejection_reason && (
                        <span className="mt-[2px] block text-[12px] text-[#B53224]">
                          Reason: {doc.rejection_reason as string}
                        </span>
                      )}
                    </div>

                    {/* State tag */}
                    <span
                      className="inline-flex flex-shrink-0 items-center gap-[4px] rounded-full px-[9px] py-[3px] text-[11px] font-bold"
                      style={{ background: tag.bg, color: tag.color }}
                    >
                      {tag.icon === "check" && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                      {tag.icon === "x" && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      )}
                      {statusKey}
                    </span>

                    {/* Actions */}
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {doc.url && (
                        <a
                          href={doc.url as string}
                          target="_blank"
                          rel="noreferrer"
                          title="Preview"
                          className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-bg-card text-muted transition-colors hover:bg-line-2 hover:text-text"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </a>
                      )}
                      {canManageDocs && (
                        <DocActions
                          docId={doc.id as string}
                          userId={group.userId}
                          status={doc.status as string}
                          rejectionReason={doc.rejection_reason as string | null}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
