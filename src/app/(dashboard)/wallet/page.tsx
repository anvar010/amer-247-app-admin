import { createClient } from "@/lib/supabase/server";
import { ConfigForm } from "./config-form";
import { BonusCashbackForm } from "./bonus-cashback-form";
import { PromoForm } from "./promo-form";
import { CashbackRulesForm } from "./cashback-rules-form";

const TX_BADGE: Record<string, { cls: string; label: string }> = {
  welcome_bonus:    { cls: "bg-gold-bg text-gold-fg border-gold-bg",           label: "Welcome" },
  promo_bonus:      { cls: "bg-gold-bg text-gold-fg border-gold-bg",           label: "Promo" },
  cashback:         { cls: "bg-gold-bg text-gold-fg border-gold-bg",            label: "Cashback" },
  service_discount: { cls: "bg-primary-bg text-amer-600 border-primary-bg",    label: "Discount" },
  admin_credit:     { cls: "bg-success-bg text-success-fg border-success-bg",  label: "Credit" },
  admin_debit:      { cls: "bg-red-50 text-danger border-red-100",             label: "Debit" },
};

export default async function WalletPage() {
  const supabase = await createClient();

  // Fetch config, wallet stats, transactions, users, cashback rules, and known service names in parallel
  const [configRes, walletsRes, txnsRes, usersRes, rulesRes] = await Promise.all([
    supabase.from("app_config").select("key,value").in("key", ["welcome_bonus", "max_credit_per_service", "cashback_type", "cashback_value"]),
    supabase.from("wallets").select("credits,total_earned,total_spent"),
    supabase
      .from("wallet_transactions")
      .select("id,user_id,amount,type,description,ref,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select("id,full_name,email")
      .order("full_name", { ascending: true }),
    supabase
      .from("cashback_rules")
      .select("id,service_name,cashback_type,cashback_value,enabled")
      .order("service_name"),
  ]);

  // Parse config
  const configMap: Record<string, { amount?: number; type?: string }> = {};
  (configRes.data || []).forEach((row) => {
    configMap[row.key] = row.value as { amount?: number; type?: string };
  });
  const welcomeBonus   = configMap["welcome_bonus"]?.amount          ?? 50;
  const maxPerService  = configMap["max_credit_per_service"]?.amount ?? 10;
  const cashbackType   = configMap["cashback_type"]?.type            ?? "amount";
  const cashbackValue  = configMap["cashback_value"]?.amount         ?? 0;

  // Wallet stats
  const wallets = walletsRes.data || [];
  const totalWallets  = wallets.length;
  const totalCredits  = wallets.reduce((s, w) => s + Number(w.credits), 0);
  const totalEarned   = wallets.reduce((s, w) => s + Number(w.total_earned), 0);
  const totalSpent    = wallets.reduce((s, w) => s + Number(w.total_spent), 0);

  const txns  = txnsRes.data  || [];
  const users = usersRes.data || [];
  const rules = rulesRes.data || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Wallet</h1>
        <p className="mt-0.5 text-sm text-muted">Manage bonus amounts, service caps, and push promotional credits to users.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active wallets",        value: totalWallets,               unit: "users",        accent: "bg-amer-700" },
          { label: "Outstanding credits",   value: `AED ${totalCredits.toFixed(2)}`,  unit: "in all wallets", accent: "bg-gold" },
          { label: "Total ever earned",     value: `AED ${totalEarned.toFixed(2)}`,   unit: "across all time",accent: "bg-teal" },
          { label: "Total ever spent",      value: `AED ${totalSpent.toFixed(2)}`,    unit: "on services",    accent: "bg-amer-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-surface p-5 shadow-sm">
            <div className={`mb-3 h-2 w-10 rounded-full ${s.accent}`} />
            <div className="text-2xl font-extrabold text-ink">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Config form */}
      <ConfigForm welcomeBonus={welcomeBonus} maxPerService={maxPerService} />

      {/* Bonus cashback */}
      <BonusCashbackForm
        cashbackType={cashbackType}
        cashbackValue={cashbackValue}
        hasActivePerServiceRules={rules.some((r) => r.enabled)}
      />

      {/* Per-service cashback rules */}
      <CashbackRulesForm rules={rules} globalCashbackValue={cashbackValue} />

      {/* Promo form */}
      <PromoForm users={users} />

      {/* Recent transactions */}
      <div className="rounded-2xl bg-surface shadow-sm">
        <div className="border-b border-line-2 px-6 py-4">
          <h2 className="text-base font-bold text-ink">Recent transactions</h2>
          <p className="mt-0.5 text-sm text-muted">Last 50 wallet events across all users</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-2 text-xs uppercase tracking-wide text-muted-2">
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Description</th>
                <th className="px-6 py-3 font-semibold">Ref</th>
                <th className="px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {txns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted">No transactions yet.</td>
                </tr>
              ) : (
                txns.map((tx) => {
                  const badge = TX_BADGE[tx.type] ?? { cls: "bg-bg-card text-muted border-line", label: tx.type };
                  const positive = Number(tx.amount) > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-bg-card">
                      <td className="px-6 py-3.5">
                        <span className="rounded-lg bg-bg-card px-2 py-0.5 font-mono text-xs text-muted-2">
                          {String(tx.user_id).slice(0, 8)}…
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className={`px-6 py-3.5 font-bold ${positive ? "text-success-fg" : "text-danger"}`}>
                        {positive ? "+" : ""}AED {Math.abs(Number(tx.amount)).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-muted">{tx.description || "—"}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-muted-2">{tx.ref ? `#${tx.ref}` : "—"}</td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-muted">
                        {new Date(tx.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
