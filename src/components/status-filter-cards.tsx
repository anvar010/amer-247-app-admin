"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type StatCell = { key: string; label: string; dotColor?: string | null };

export function StatusFilterCards({
  cells,
  statusCounts,
  totalCount,
}: {
  cells: StatCell[];
  statusCounts: Record<string, number>;
  totalCount: number;
}) {
  const searchParams = useSearchParams();
  const activeStatus = searchParams.get("status") ?? "";
  const activeKey = activeStatus || "all";

  const prevKey = useRef(activeKey);
  const [animatingKey, setAnimatingKey] = useState<string | null>(null);

  useEffect(() => {
    if (prevKey.current !== activeKey) {
      prevKey.current = activeKey;
      setAnimatingKey(activeKey);
      const t = setTimeout(() => setAnimatingKey(null), 500);
      return () => clearTimeout(t);
    }
  }, [activeKey]);

  return (
    <div className="grid grid-cols-3 gap-[8px] sm:grid-cols-6">
      {cells.map(({ key, label, dotColor }) => {
        const count = key === "all" ? totalCount : (statusCounts[key] ?? 0);
        const active = activeKey === key;
        const color = dotColor ?? "#E24020";
        const isAnimating = animatingKey === key;

        return (
          <Link
            key={key}
            href={key === "all" ? "/applications" : `/applications?status=${key}`}
            className={`relative flex flex-col overflow-hidden rounded-[18px] p-[16px] text-left transition-all duration-200 hover:-translate-y-[2px] hover:scale-[1.01] ${isAnimating ? "card-animate-in" : ""}`}
            style={{
              background: active
                ? `linear-gradient(145deg, ${color}22 0%, ${color}0d 100%)`
                : "#ffffff",
              border: active
                ? `1px solid ${color}44`
                : "1px solid rgba(0,0,0,0.07)",
              boxShadow: active
                ? `0 8px 24px ${color}28, 0 2px 6px ${color}18, inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 ${color}12`
                : "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 #fff",
            }}
          >
            {/* Glow ring — pulses in on activate */}
            {isAnimating && (
              <span
                className="glow-ring pointer-events-none absolute inset-0 rounded-[18px]"
                style={{ boxShadow: `0 0 0 3px ${color}55`, border: `2px solid ${color}66` }}
              />
            )}

            {/* Shimmer sweep — fires on activate */}
            <span
              className="shimmer-sweep pointer-events-none absolute inset-y-0 w-[45%]"
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
                display: isAnimating ? "block" : "none",
              }}
            />

            {/* Static glass specular highlight */}
            <span
              className="pointer-events-none absolute inset-x-[1px] top-[1px] h-[40%] rounded-t-[17px]"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)",
              }}
            />

            {/* Icon badge */}
            <div className="relative mb-[14px]">
              <span
                className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] transition-all duration-300"
                style={{
                  background: active ? `${color}18` : "#f4f5f7",
                  border: active ? `1px solid ${color}25` : "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                {key === "all" ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={active ? color : "#6B7280"}
                    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: "stroke 0.3s" }}
                  >
                    <rect x="4" y="3" width="16" height="18" rx="2"/>
                    <path d="M8 8h8M8 12h8M8 16h5"/>
                  </svg>
                ) : (
                  <svg width="7" height="7" viewBox="0 0 10 10" fill={color}>
                    <circle cx="5" cy="5" r="5"/>
                  </svg>
                )}
              </span>
            </div>

            {/* Count */}
            <div
              className="relative text-[28px] font-black leading-none tracking-[-0.03em] transition-colors duration-300"
              style={{
                fontFamily: "var(--font-outfit)",
                color: active ? color : "var(--ink)",
              }}
            >
              {count}
            </div>

            {/* Label */}
            <div
              className="relative mt-[5px] overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-semibold transition-colors duration-300"
              style={{ color: active ? `${color}cc` : "#6B7280" }}
            >
              {label}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
