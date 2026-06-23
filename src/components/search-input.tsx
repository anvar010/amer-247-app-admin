"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchInput({ placeholder = "Search…", paramKey = "q" }: { placeholder?: string; paramKey?: string }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get(paramKey) ?? "");
  }, [searchParams, paramKey]);

  function push(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set(paramKey, q);
    else params.delete(paramKey);
    router.push(`${pathname}?${params.toString()}`);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push(q), 300);
  }

  function clear() {
    setValue("");
    push("");
  }

  return (
    <div className="relative flex items-center">
      <svg
        className="pointer-events-none absolute left-[11px] text-muted-2"
        width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-[38px] w-[220px] rounded-[10px] border border-line bg-surface pl-[34px] pr-[30px] text-[13px] text-ink placeholder:text-muted-2 outline-none transition-colors focus:border-muted-2"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-[9px] flex items-center text-muted-2 hover:text-muted transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  );
}
