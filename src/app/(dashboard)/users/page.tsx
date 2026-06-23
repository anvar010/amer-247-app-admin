import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { RealtimeRefresher } from "@/components/realtime-refresher";

const PER_PAGE = 10;

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

const ROLE_PILL: Record<string, { bg: string; color: string; label: string }> = {
  super_admin: { bg: "rgba(27,163,156,0.13)", color: "#0D6B66",       label: "Super Admin" },
  admin:       { bg: "rgba(255,81,47,0.12)",  color: "#E24020",       label: "Admin"       },
  user:        { bg: "var(--bg-card)",         color: "var(--muted)", label: "User"        },
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const searchQuery = q?.trim() ?? "";
  const page        = Math.max(1, parseInt(pageParam ?? "1", 10));

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from("profiles").select("role").eq("id", user!.id).single();
  const currentUserRole = currentProfile?.role ?? "user";

  // Base query builder (reused for both count and data)
  const buildQuery = () => {
    let q = supabase.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (currentUserRole !== "super_admin") q = q.eq("role", "user") as typeof q;
    if (searchQuery) q = q.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,mobile.ilike.%${searchQuery}%`) as typeof q;
    return q;
  };

  // When searching: return all matches. When paginating: apply range.
  const { data: profiles, count: total } = searchQuery
    ? await buildQuery()
    : await buildQuery().range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

  const rows       = profiles || [];
  const totalCount = total ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <RealtimeRefresher watches={[{ table: "profiles", events: ["INSERT", "UPDATE"] }]} />
      {/* Header */}
      <div>
        <h2
          className="text-[19px] font-extrabold tracking-tight text-ink"
          style={{ fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}
        >
          Users
        </h2>
        <p className="mt-[3px] text-[13px] text-muted">
          {totalCount} registered account{totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table card */}
      <div
        className="rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          <h3
            className="text-[16px] font-bold text-ink"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            All users
          </h3>
          <div className="ml-auto flex items-center gap-3">
            <SearchInput placeholder="Search name, email, mobile…" />
            <span className="rounded-full bg-bg-card px-3 py-[3px] text-[11px] font-semibold text-muted">
              {searchQuery ? `${rows.length} found` : `${totalCount} total`}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line-2">
                {["Name", "Email", "Mobile", "Nationality", "Joined", "Role", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-muted-2 first:pl-[22px] last:pr-[22px]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-[22px] py-16 text-center">
                    <div className="mx-auto mb-[14px] flex h-14 w-14 items-center justify-center rounded-[16px] bg-bg-card text-muted-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      </svg>
                    </div>
                    <p className="text-[13.5px] text-muted">
                      {searchQuery ? `No users matching "${searchQuery}"` : "No users yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const ini  = initials(p.full_name || p.email || "?");
                  const role = ROLE_PILL[p.role] ?? ROLE_PILL.user;
                  return (
                    <tr key={p.id} className="border-b border-line-2 transition-colors last:border-none hover:bg-bg-card">
                      <td className="py-[14px] pl-[22px] pr-4">
                        <div className="flex items-center gap-[11px]">
                          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-bg-card text-[13px] font-bold text-amer-700">
                            {ini}
                          </div>
                          <span className="text-[13.5px] font-semibold text-ink">{p.full_name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-[14px] text-[13px] text-muted">{p.email || "—"}</td>
                      <td className="px-4 py-[14px] text-[13px] text-muted">{p.mobile || "—"}</td>
                      <td className="px-4 py-[14px] text-[13px] text-muted">{p.nationality || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-[14px] text-[13px] text-muted">
                        {new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-[14px]">
                        <span
                          className="inline-flex items-center rounded-full px-[10px] py-[4px] text-[11.5px] font-bold"
                          style={{ background: role.bg, color: role.color }}
                        >
                          {role.label}
                        </span>
                      </td>
                      <td className="py-[14px] pl-4 pr-[22px]">
                        <Link
                          href={`/users/${p.id}`}
                          className="flex h-8 items-center rounded-[9px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-muted-2"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — hidden when searching */}
        {!searchQuery && (
          <Pagination page={page} total={totalCount} perPage={PER_PAGE} />
        )}
      </div>
    </div>
  );
}
