"use client";

import { useActionState, useState, useTransition } from "react";
import { updateCashbackConfig } from "./actions";

const INPUT = "w-full rounded-xl border border-line bg-bg-card px-4 py-2.5 text-sm text-ink placeholder:text-muted-2 outline-none focus:border-amer-700";
const LABEL = "mb-1 block text-xs font-semibold text-ink";

type Mode = "off" | "amount" | "percentage";

interface Props {
  cashbackType: string;
  cashbackValue: number;
  hasActivePerServiceRules: boolean;
}

export function BonusCashbackForm({ cashbackType, cashbackValue, hasActivePerServiceRules }: Props) {
  const [state, action, pending] = useActionState(updateCashbackConfig, null);
  const [disabling, startDisable] = useTransition();
  const locked = hasActivePerServiceRules;

  const dbMode: Mode = cashbackValue > 0
    ? (cashbackType === "percentage" ? "percentage" : "amount")
    : "off";

  const [mode, setMode] = useState<Mode>(dbMode);

  // Clicking "Off" immediately saves without a submit button
  const handleOff = () => {
    setMode("off");
    const fd = new FormData();
    fd.set("cashback_type", "amount");
    fd.set("cashback_value", "0");
    startDisable(() => { action(fd); });
  };

  const MODES: { id: Mode; label: string; desc: string }[] = [
    { id: "off",        label: "Off",        desc: "No cashback" },
    { id: "amount",     label: "Fixed AED",  desc: "Flat amount" },
    { id: "percentage", label: "Percentage", desc: "% of fee" },
  ];

  return (
    <div className="rounded-2xl bg-surface shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-line-2 px-6 py-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold-bg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5 text-gold-fg">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-ink">Bonus cashback</h2>
          <p className="text-xs text-muted">Reward users with wallet credit when they submit any application.</p>
        </div>

        {/* Live DB status */}
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
          locked              ? "border-line bg-bg-card text-muted" :
          dbMode === "off"   ? "border-line bg-bg-card text-muted" :
                               "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
          {locked      ? "Locked" :
           dbMode === "off"        ? "Inactive" :
           dbMode === "amount"     ? `Active · AED ${cashbackValue}` :
                                     `Active · ${cashbackValue}%`}
        </span>
      </div>

      {/* Locked notice */}
      {locked && (
        <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-6 py-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0 text-amber-600">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-xs text-amber-800">
            Per-service cashback rules are active — disable all rules below before enabling global cashback.
          </p>
        </div>
      )}

      <div className={locked ? "pointer-events-none opacity-40 select-none" : ""}>
        {/* Mode selector */}
        <div className="px-6 py-5">
          <p className={LABEL}>Cashback mode</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {MODES.map((m) => {
              const active = mode === m.id;
              const isOff  = m.id === "off";
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={isOff ? handleOff : () => setMode(m.id)}
                  disabled={disabling || pending}
                  className={`flex flex-col rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                    active
                      ? isOff
                        ? "border-line-2 bg-bg-card"
                        : "border-amer-700 bg-primary-bg"
                      : "border-line bg-surface hover:border-line-2"
                  }`}
                >
                  <span className={`text-sm font-semibold ${active && !isOff ? "text-amer-700" : "text-ink"}`}>
                    {m.label}
                    {isOff && disabling && " …"}
                  </span>
                  <span className="mt-0.5 text-xs text-muted">{m.desc}</span>
                  <span className={`mt-2 h-2 w-2 rounded-full ${
                    active ? (isOff ? "bg-muted" : "bg-amer-700") : "bg-line-2"
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Value form — only for amount / percentage */}
        {mode !== "off" && (
          <form action={action} className="border-t border-line-2 px-6 py-5">
            <input type="hidden" name="cashback_type" value={mode} />
            <div className="flex items-end gap-4">
              <div className="max-w-xs flex-1">
                <label className={LABEL}>
                  {mode === "percentage" ? "Percentage (%)" : "Amount (AED)"}
                </label>
                <input
                  name="cashback_value"
                  type="number"
                  min="0"
                  step={mode === "percentage" ? "0.1" : "1"}
                  max={mode === "percentage" ? "100" : undefined}
                  required
                  defaultValue={dbMode === mode && cashbackValue > 0 ? cashbackValue : undefined}
                  placeholder={mode === "percentage" ? "e.g. 5" : "e.g. 10"}
                  className={INPUT}
                />
                <p className="mt-1 text-xs text-muted">
                  {mode === "percentage"
                    ? "Users earn this % of their service fee as wallet credit."
                    : "Fixed AED amount credited per successful application."}
                </p>
              </div>
              <button
                type="submit"
                disabled={pending}
                className="mb-6 rounded-full bg-amer-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amer-600 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
            {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
            {state?.success && <p className="mt-2 text-sm text-emerald-600">Saved.</p>}
          </form>
        )}

        {/* Off state — no save button, disabled state shown */}
        {mode === "off" && (
          <div className="border-t border-line-2 px-6 py-4">
            {state?.error   && <p className="text-sm text-red-600">{state.error}</p>}
            {state?.success && <p className="text-sm text-emerald-600">Cashback disabled.</p>}
            {!state?.error && !state?.success && (
              <p className="text-xs text-muted">No cashback will be given. Select Fixed AED or Percentage to enable.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
