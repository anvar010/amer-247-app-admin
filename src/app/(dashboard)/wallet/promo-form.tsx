"use client";

import { useActionState, useState } from "react";
import { pushPromoBonus } from "./actions";

const INPUT = "w-full rounded-xl border border-line bg-bg-card px-4 py-2.5 text-sm text-ink placeholder:text-muted-2 outline-none focus:border-amer-700";
const LABEL = "mb-1.5 block text-xs font-semibold text-ink";

const PRESETS = [
  { label: "Eid Al-Fitr", desc: "Eid Mubarak gift — AMER 24/7" },
  { label: "National Day", desc: "UAE National Day bonus — AMER 24/7" },
  { label: "Ramadan", desc: "Ramadan Kareem gift — AMER 24/7" },
  { label: "Launch offer", desc: "Special launch offer — AMER 24/7" },
];

type User = { id: string; full_name: string | null; email: string | null };

export function PromoForm({ users }: { users: User[] }) {
  const [state, action, pending] = useActionState(pushPromoBonus, null);
  const [target, setTarget] = useState<"all" | "one">("all");
  const [desc, setDesc] = useState("");
  const [search, setSearch] = useState("");

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(q) ?? false) ||
      (u.email?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="rounded-2xl bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-bg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-amer-600">
            <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-ink">Push promotional bonus</h2>
          <p className="mt-0.5 text-sm text-muted">Credit extra AED to all users or a specific account for campaigns and celebrations.</p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Amount */}
          <div>
            <label className={LABEL}>Bonus amount (AED)</label>
            <input
              name="amount"
              type="number"
              min="1"
              step="1"
              required
              placeholder="25"
              className={INPUT}
            />
          </div>

          {/* Target */}
          <div>
            <label className={LABEL}>Target</label>
            <select
              name="target"
              value={target}
              onChange={(e) => { setTarget(e.target.value as "all" | "one"); setSearch(""); }}
              className={INPUT}
            >
              <option value="all">All users</option>
              <option value="one">Specific user</option>
            </select>
          </div>
        </div>

        {/* User picker — shown when target = one */}
        {target === "one" && (
          <div>
            <label className={LABEL}>Select user</label>
            {/* Search filter */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className={`${INPUT} mb-2`}
            />
            <select name="user_id" required className={INPUT} size={5}>
              {filtered.length === 0 ? (
                <option disabled>No users found</option>
              ) : (
                filtered.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || "—"}  ·  {u.email}
                  </option>
                ))
              )}
            </select>
            <p className="mt-1.5 text-xs text-muted">
              {filtered.length} user{filtered.length !== 1 ? "s" : ""} shown
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <label className={LABEL}>Description (shown in user&apos;s transaction history)</label>
          <input
            name="description"
            type="text"
            required
            maxLength={120}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Eid Al-Fitr gift — AMER 24/7"
            className={INPUT}
          />
          {/* Quick-fill presets */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setDesc(p.desc)}
                className="rounded-full border border-line bg-bg-card px-2.5 py-1 text-xs font-medium text-muted hover:border-amer-700 hover:text-amer-700"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {state?.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {state.success}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-gradient-to-r from-gold-light to-gold-dark px-6 py-2.5 text-sm font-semibold text-[#2A1F00] shadow-md shadow-gold/30 hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Sending…" : target === "all" ? "Push to all users" : "Push to user"}
          </button>
          {target === "all" && (
            <span className="ml-3 text-xs text-muted">Irreversible — verify before confirming.</span>
          )}
        </div>
      </form>
    </div>
  );
}
