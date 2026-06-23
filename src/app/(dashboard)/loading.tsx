export default function Loading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <div className="h-6 w-40 rounded-lg bg-line" />
        <div className="h-4 w-64 rounded-md bg-line" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-[10px] sm:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface p-[13px_14px]"
          >
            <div className="h-7 w-7 rounded-[9px] bg-line" />
            <div className="h-7 w-12 rounded-md bg-line" />
            <div className="h-3 w-16 rounded-md bg-line" />
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-[var(--r-lg)] border border-line bg-surface" style={{ boxShadow: "var(--shadow-card)" }}>
        {/* Table toolbar */}
        <div className="flex items-center gap-3 border-b border-line px-[22px] py-[18px]">
          <div className="h-5 w-36 rounded-md bg-line" />
          <div className="ml-auto h-8 w-48 rounded-[9px] bg-line" />
        </div>

        {/* Table rows */}
        <div className="flex flex-col divide-y divide-line-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-[22px] py-[14px]">
              <div className="h-[34px] w-[34px] flex-shrink-0 rounded-[10px] bg-line" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-4 w-32 rounded-md bg-line" />
                <div className="h-3 w-24 rounded-md bg-line" />
              </div>
              <div className="h-4 w-24 rounded-md bg-line" />
              <div className="h-4 w-16 rounded-md bg-line" />
              <div className="ml-auto h-6 w-20 rounded-full bg-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
