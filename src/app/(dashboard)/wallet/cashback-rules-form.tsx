"use client";

import { useState, useTransition, useActionState } from "react";
import { SERVICE_HUBS } from "@/lib/services-catalog";
import { upsertCashbackRule, deleteCashbackRule, toggleCashbackRule } from "./actions";

const INPUT = "w-full rounded-xl border border-line bg-bg-card px-4 py-2.5 text-sm text-ink placeholder:text-muted-2 outline-none focus:border-amer-700";
const LABEL = "mb-1 block text-xs font-semibold text-ink";

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${on ? "bg-amer-700" : "bg-line-2"}`}
      aria-pressed={on}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

type Rule = {
  id: string;
  service_name: string;
  cashback_type: string;
  cashback_value: number;
  enabled: boolean;
};

export function CashbackRulesForm({
  rules,
  globalCashbackValue,
}: {
  rules: Rule[];
  globalCashbackValue: number;
}) {
  const [cbType, setCbType] = useState("amount");
  const [search, setSearch] = useState("");
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveState, saveAction] = useActionState(upsertCashbackRule, null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState("amount");
  const [editValue, setEditValue] = useState("");
  const [editPending, startEditTransition] = useTransition();

  const startEdit = (rule: Rule) => {
    setEditingId(rule.id);
    setEditType(rule.cashback_type);
    setEditValue(String(rule.cashback_value));
  };

  const cancelEdit = () => setEditingId(null);

  const handleEdit = (rule: Rule) => {
    const fd = new FormData();
    fd.set("service_name", rule.service_name);
    fd.set("cashback_type", editType);
    fd.set("cashback_value", editValue);
    startEditTransition(() => {
      saveAction(fd);
      setEditingId(null);
    });
  };

  const globalOn = globalCashbackValue > 0;
  const locked = globalOn;

  const existingNames = new Set(rules.map((r) => r.service_name));

  // Map service name → hub label for display
  const serviceToHub: Record<string, string> = {};
  for (const hub of SERVICE_HUBS) {
    for (const group of hub.groups) {
      for (const svc of group.services) {
        serviceToHub[svc] = hub.label;
      }
    }
  }

  const hub = SERVICE_HUBS.find((h) => h.id === selectedHub) ?? null;

  const query = search.toLowerCase();
  const filteredGroups = hub
    ? hub.groups
        .map((g) => ({
          ...g,
          services: g.services.filter((s) => !query || s.toLowerCase().includes(query)),
        }))
        .filter((g) => g.services.length > 0)
    : [];

  const toggleService = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const selectAllInGroup = (services: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      services.forEach((s) => next.add(s));
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await deleteCashbackRule(id);
    setDeleting(null);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    setToggling(id);
    await toggleCashbackRule(id, !enabled);
    setToggling(null);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (locked || selected.size === 0) return;
    const form = e.currentTarget;
    const cbTypeVal = (form.elements.namedItem("cashback_type") as HTMLSelectElement).value;
    const cbValueVal = (form.elements.namedItem("cashback_value") as HTMLInputElement).value;
    for (const name of selected) {
      const fd = new FormData();
      fd.set("service_name", name);
      fd.set("cashback_type", cbTypeVal);
      fd.set("cashback_value", cbValueVal);
      startTransition(() => { saveAction(fd); });
    }
    setSelected(new Set());
    setShowForm(false);
    setSelectedHub(null);
  };

  return (
    <div className="rounded-2xl bg-surface shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-line-2 px-6 py-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold-bg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5 text-gold-fg">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-ink">Per-service cashback rules</h2>
          <p className="text-xs text-muted">Override cashback for specific services only.</p>
        </div>
        {!locked && (
          <button
            type="button"
            onClick={() => { setShowForm((v) => !v); setSelectedHub(null); setSelected(new Set()); }}
            className="rounded-full bg-amer-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amer-600"
          >
            {showForm ? "Cancel" : "+ Add rule"}
          </button>
        )}
      </div>

      {/* Conflict notice */}
      {globalOn && (
        <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-6 py-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0 text-amber-600">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-xs text-amber-800">
            Global cashback is on — turn it off in Wallet configuration above to use per-service rules.
          </p>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 && !showForm && (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-muted">No per-service rules yet.</p>
          {!locked && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 rounded-full border border-amer-300 px-4 py-1.5 text-xs font-semibold text-amer-700 hover:bg-primary-bg"
            >
              + Add your first rule
            </button>
          )}
        </div>
      )}

      {rules.length > 0 && (
        <div className="divide-y divide-line-2">
          {rules.map((rule) => {
            const isEditing = editingId === rule.id;
            return (
              <div key={rule.id}>
                {/* Normal row */}
                <div className="flex items-center gap-4 px-6 py-3.5">
                  <Toggle
                    on={rule.enabled}
                    onToggle={() => handleToggle(rule.id, rule.enabled)}
                    disabled={toggling === rule.id || isEditing}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {serviceToHub[rule.service_name] && (
                        <span className="flex-shrink-0 rounded-full bg-primary-bg px-2 py-0.5 text-xs font-semibold text-amer-700">
                          {serviceToHub[rule.service_name]}
                        </span>
                      )}
                      <p className={`truncate text-sm font-medium ${rule.enabled ? "text-ink" : "text-muted"}`}>
                        {rule.service_name}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {rule.cashback_type === "percentage"
                        ? `${rule.cashback_value}% of fee`
                        : `AED ${rule.cashback_value} fixed`}
                    </p>
                  </div>
                  <span className={`hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold sm:inline-block ${
                    rule.enabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-line bg-bg-card text-muted"
                  }`}>
                    {rule.enabled ? "On" : "Off"}
                  </span>
                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => isEditing ? cancelEdit() : startEdit(rule)}
                    disabled={editPending}
                    className={`rounded-full p-1.5 disabled:opacity-50 ${isEditing ? "bg-primary-bg text-amer-700" : "text-muted hover:bg-bg-card hover:text-ink"}`}
                    title={isEditing ? "Cancel edit" : "Edit rule"}
                  >
                    {isEditing ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    )}
                  </button>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(rule.id)}
                    disabled={deleting === rule.id || isEditing}
                    className="rounded-full p-1.5 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Remove rule"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>

                {/* Inline edit panel */}
                {isEditing && (
                  <div className="border-t border-line-2 bg-bg-card px-6 py-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-2">Edit — {rule.service_name}</p>
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="min-w-[160px]">
                        <label className="mb-1 block text-xs font-semibold text-ink">Type</label>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className={INPUT}
                        >
                          <option value="amount">Fixed amount (AED)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                      <div className="min-w-[120px]">
                        <label className="mb-1 block text-xs font-semibold text-ink">
                          {editType === "percentage" ? "Percentage (%)" : "Amount (AED)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step={editType === "percentage" ? "0.1" : "1"}
                          max={editType === "percentage" ? "100" : undefined}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className={INPUT}
                        />
                      </div>
                      <div className="flex gap-2 pb-0.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(rule)}
                          disabled={editPending || !editValue}
                          className="rounded-full bg-amer-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amer-600 disabled:opacity-50"
                        >
                          {editPending ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-bg-card"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add rule form */}
      {showForm && !locked && (
        <form onSubmit={handleSubmit} className="border-t border-line-2 px-6 py-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-2">New rule</p>

          {/* Cashback type + value */}
          <div className="mb-5 grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Type</label>
              <select name="cashback_type" value={cbType} onChange={(e) => setCbType(e.target.value)} className={INPUT}>
                <option value="amount">Fixed amount (AED)</option>
                <option value="percentage">Percentage of fee (%)</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>{cbType === "percentage" ? "Percentage (%)" : "Amount (AED)"}</label>
              <input
                name="cashback_value"
                type="number"
                min="0"
                step={cbType === "percentage" ? "0.1" : "1"}
                max={cbType === "percentage" ? "100" : undefined}
                required
                placeholder={cbType === "percentage" ? "e.g. 5" : "e.g. 10"}
                className={INPUT}
              />
            </div>
          </div>

          {/* Step 1 */}
          <div className="mb-5">
            <p className={LABEL}>Step 1 — Pick a main service category</p>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SERVICE_HUBS.filter((h) => h.main).map((h) => {
                const on = selectedHub === h.id;
                const total = h.groups.reduce((s, g) => s + g.services.length, 0);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => { setSelectedHub(on ? null : h.id); setSelected(new Set()); setSearch(""); }}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
                      on
                        ? "border-amer-700 bg-primary-bg font-semibold text-amer-700"
                        : "border-line bg-bg-card text-ink hover:border-amer-300"
                    }`}
                  >
                    <span>{h.label}</span>
                    <span className={`text-xs ${on ? "text-amer-500" : "text-muted"}`}>{total}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 */}
          {hub && (
            <div className="mb-5">
              <p className={LABEL}>Step 2 — Select services from {hub.label}</p>

              {/* Search */}
              <div className="relative mt-1 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search in ${hub.label}…`}
                  className="w-full rounded-xl border border-line bg-bg-card py-2 pl-9 pr-8 text-sm text-ink placeholder:text-muted-2 outline-none focus:border-amer-700"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-2 hover:text-ink">✕</button>
                )}
              </div>

              {/* Selected chips */}
              {selected.size > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[...selected].map((name) => (
                    <span key={name} className="flex items-center gap-1 rounded-full border border-amer-200 bg-primary-bg px-2.5 py-0.5 text-xs font-semibold text-amer-700">
                      {name}
                      <button type="button" onClick={() => toggleService(name)} className="ml-0.5 opacity-60 hover:opacity-100">✕</button>
                    </span>
                  ))}
                  <button type="button" onClick={() => setSelected(new Set())}
                    className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted hover:text-ink">
                    Clear
                  </button>
                </div>
              )}

              {/* Services list */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-line">
                {filteredGroups.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted">No services match.</p>
                ) : (
                  filteredGroups.map((g) => (
                    <div key={g.group}>
                      <div className="sticky top-0 flex items-center justify-between border-b border-line bg-bg-card px-4 py-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-2">{g.group}</p>
                        <button type="button" onClick={() => selectAllInGroup(g.services)}
                          className="text-xs text-amer-600 hover:underline">All</button>
                      </div>
                      {g.services.map((name) => {
                        const isSelected = selected.has(name);
                        const hasRule = existingNames.has(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleService(name)}
                            className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-bg-card ${isSelected ? "bg-primary-bg" : ""}`}
                          >
                            <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                              isSelected ? "border-amer-700 bg-amer-700 text-white" : "border-line-2 bg-white"
                            }`}>
                              {isSelected && (
                                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                            <span className={`flex-1 ${isSelected ? "font-semibold text-amer-700" : "text-ink"}`}>{name}</span>
                            {hasRule && !isSelected && (
                              <span className="text-xs text-muted">existing</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {saveState?.error && (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{saveState.error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending || selected.size === 0}
              className="rounded-full bg-amer-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amer-600 disabled:opacity-50"
            >
              {isPending ? "Saving…" : selected.size === 0 ? "Select services first" : `Save ${selected.size} rule${selected.size > 1 ? "s" : ""}`}
            </button>
            {saveState?.success && <p className="text-sm text-emerald-600">Saved.</p>}
          </div>
        </form>
      )}
    </div>
  );
}
