export default function Loading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-32 rounded-lg bg-line" />
        <div className="h-4 w-56 rounded-md bg-line" />
      </div>

      {/* Filter tabs (All / Pending / Verified / Rejected) */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-[9px] bg-line" />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-[var(--r-lg)] border border-line bg-surface overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          <div className="h-5 w-36 rounded-md bg-line" />
          <div className="ml-auto h-6 w-20 rounded-full bg-line" />
        </div>
        <div className="flex flex-col divide-y divide-line-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-[22px] py-[14px]">
              {/* User */}
              <div className="flex items-center gap-[11px] w-44">
                <div className="h-[34px] w-[34px] flex-shrink-0 rounded-[10px] bg-line" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-24 rounded-md bg-line" />
                  <div className="h-3 w-16 rounded-md bg-line" />
                </div>
              </div>
              {/* Doc type */}
              <div className="h-4 w-28 rounded-md bg-line" />
              {/* Status badge */}
              <div className="h-6 w-20 rounded-full bg-line" />
              {/* Date */}
              <div className="ml-auto h-4 w-24 rounded-md bg-line" />
              {/* Actions */}
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-[9px] bg-line" />
                <div className="h-8 w-20 rounded-[9px] bg-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
