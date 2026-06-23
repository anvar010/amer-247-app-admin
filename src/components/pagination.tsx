"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function Pagination({ page, total, perPage }: { page: number; total: number; perPage: number }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const totalPages   = Math.ceil(total / perPage);

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between border-t border-line px-[22px] py-[13px]">
      <span className="text-[12.5px] text-muted">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="flex h-8 items-center rounded-[9px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-muted-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Prev
        </button>
        <span className="flex h-8 min-w-[32px] items-center justify-center rounded-[9px] bg-bg-card text-[12px] font-bold text-ink">
          {page}
        </span>
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 items-center rounded-[9px] border border-line bg-surface px-3 text-[12px] font-semibold text-ink transition-colors hover:border-muted-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
