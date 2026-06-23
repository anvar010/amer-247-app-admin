export default function Loading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-28 rounded-lg bg-line" />
        <div className="h-4 w-56 rounded-md bg-line" />
      </div>

      {/* 2 role cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[var(--r-lg)] border border-line bg-surface p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-[12px] bg-line" />
              <div className="h-5 w-28 rounded-md bg-line" />
            </div>
            <div className="h-3 w-full rounded-md bg-line mb-2" />
            <div className="h-3 w-4/5 rounded-md bg-line mb-4" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-line" />
                  <div className="h-3 w-40 rounded-md bg-line" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Staff table */}
      <div className="rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          <div className="h-5 w-24 rounded-md bg-line" />
          <div className="ml-auto h-9 w-28 rounded-[9px] bg-line" />
        </div>
        <div className="flex flex-col divide-y divide-line-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-[22px] py-[14px]">
              <div className="flex items-center gap-[11px] flex-1">
                <div className="h-[34px] w-[34px] flex-shrink-0 rounded-[10px] bg-line" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-32 rounded-md bg-line" />
                  <div className="h-3 w-40 rounded-md bg-line" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-line" />
              <div className="h-4 w-24 rounded-md bg-line" />
              <div className="flex gap-2">
                <div className="h-8 w-24 rounded-[9px] bg-line" />
                <div className="h-8 w-20 rounded-[9px] bg-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
