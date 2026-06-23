export default function Loading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-20 rounded-lg bg-line" />
        <div className="h-4 w-40 rounded-md bg-line" />
      </div>

      {/* Table only — no stat cards */}
      <div className="rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          <div className="h-5 w-24 rounded-md bg-line" />
          <div className="ml-auto flex gap-3">
            <div className="h-8 w-48 rounded-[9px] bg-line" />
            <div className="h-6 w-20 rounded-full bg-line" />
          </div>
        </div>
        <div className="flex flex-col divide-y divide-line-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-[22px] py-[14px]">
              <div className="flex items-center gap-[11px] flex-1">
                <div className="h-[34px] w-[34px] flex-shrink-0 rounded-[10px] bg-line" />
                <div className="h-4 w-32 rounded-md bg-line" />
              </div>
              <div className="h-4 w-40 rounded-md bg-line" />
              <div className="h-4 w-28 rounded-md bg-line" />
              <div className="h-4 w-20 rounded-md bg-line" />
              <div className="h-4 w-24 rounded-md bg-line" />
              <div className="h-6 w-16 rounded-full bg-line" />
              <div className="h-8 w-14 rounded-[9px] bg-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
