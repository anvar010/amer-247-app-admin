export default function Loading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-36 rounded-lg bg-line" />
        <div className="h-4 w-52 rounded-md bg-line" />
      </div>

      {/* 3 KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[var(--r-lg)] border border-line bg-surface p-[18px]" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="h-[42px] w-[42px] rounded-[13px] bg-line" />
            <div className="mt-[14px] h-8 w-12 rounded-md bg-line" />
            <div className="mt-2 h-3 w-28 rounded-md bg-line" />
          </div>
        ))}
      </div>

      {/* 2-column: broadcast list + compose form */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* Broadcast list */}
        <div className="rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
            <div className="h-5 w-28 rounded-md bg-line" />
            <div className="ml-auto h-6 w-16 rounded-full bg-line" />
          </div>
          <div className="flex flex-col divide-y divide-line-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-[22px] py-[16px]">
                <div className="h-[38px] w-[38px] flex-shrink-0 rounded-[11px] bg-line" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 w-48 rounded-md bg-line" />
                  <div className="h-3 w-64 rounded-md bg-line" />
                  <div className="h-3 w-24 rounded-md bg-line" />
                </div>
                <div className="h-6 w-14 rounded-full bg-line" />
              </div>
            ))}
          </div>
        </div>

        {/* Compose form panel */}
        <div className="rounded-[var(--r-lg)] border border-line bg-surface p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="h-5 w-32 rounded-md bg-line mb-4" />
          <div className="flex flex-col gap-3">
            <div className="h-9 w-full rounded-[9px] bg-line" />
            <div className="h-9 w-full rounded-[9px] bg-line" />
            <div className="h-24 w-full rounded-[9px] bg-line" />
            <div className="h-9 w-full rounded-[9px] bg-line" />
            <div className="h-10 w-full rounded-[9px] bg-line mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
