"use client";

import { useActionState } from "react";
import { updateWalletConfig } from "./actions";

const INPUT = "w-full rounded-xl border border-line bg-bg-card px-4 py-2.5 text-sm text-ink placeholder:text-muted-2 outline-none focus:border-amer-700";
const LABEL = "mb-1 block text-xs font-semibold text-ink";

interface Props {
  welcomeBonus: number;
  maxPerService: number;
}

export function ConfigForm({ welcomeBonus, maxPerService }: Props) {
  const [state, action, pending] = useActionState(updateWalletConfig, null);

  return (
    <div className="rounded-2xl bg-surface shadow-sm">
      <div className="flex items-center gap-4 border-b border-line-2 px-6 py-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold-bg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5 text-gold-fg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">Wallet configuration</h2>
          <p className="text-xs text-muted">Welcome bonus credited on sign-up and wallet usage cap per service.</p>
        </div>
      </div>

      <form action={action} className="divide-y divide-line-2">
        <div className="grid grid-cols-1 gap-6 px-6 py-5 sm:grid-cols-2">
          <div>
            <label className={LABEL}>Welcome bonus (AED)</label>
            <input name="welcome_bonus" type="number" min="0" step="1" required defaultValue={welcomeBonus} className={INPUT} />
            <p className="mt-1 text-xs text-muted">Credited automatically when a new user signs up.</p>
          </div>
          <div>
            <label className={LABEL}>Max wallet usage per service (AED)</label>
            <input name="max_per_service" type="number" min="0" step="1" required defaultValue={maxPerService} className={INPUT} />
            <p className="mt-1 text-xs text-muted">Maximum credits a user can apply towards one application.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-4">
          <button type="submit" disabled={pending}
            className="rounded-full bg-amer-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amer-600 disabled:opacity-50">
            {pending ? "Saving…" : "Save"}
          </button>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-600">Saved.</p>}
        </div>
      </form>
    </div>
  );
}
