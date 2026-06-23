export default function Loading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {/* Greeting */}
      <div className="flex flex-col gap-2">
        <div className="h-7 w-56 rounded-lg bg-line" />
        <div className="h-4 w-40 rounded-md bg-line" />
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[var(--r-lg)] border border-line bg-surface p-5">
            <div className="mb-3 h-[42px] w-[42px] rounded-[13px] bg-line" />
            <div className="h-8 w-16 rounded-md bg-line" />
            <div className="mt-2 h-3 w-24 rounded-md bg-line" />
          </div>
        ))}
      </div>

      {/* Pipeline bar */}
      <div className="rounded-[var(--r-lg)] border border-line bg-surface p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="mb-4 h-5 w-32 rounded-md bg-line" />
        <div className="flex items-end gap-3 h-24">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-t-md bg-line" style={{ height: `${40 + i * 12}%` }} />
          ))}
        </div>
      </div>

      {/* Recent apps table */}
      <div className="rounded-[var(--r-lg)] border border-line bg-surface" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between border-b border-line px-[22px] py-[18px]">
          <div className="h-5 w-36 rounded-md bg-line" />
          <div className="h-4 w-20 rounded-md bg-line" />
        </div>
        <div className="flex flex-col divide-y divide-line-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-[22px] py-[14px]">
              <div className="h-[34px] w-[34px] flex-shrink-0 rounded-[10px] bg-line" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-4 w-28 rounded-md bg-line" />
                <div className="h-3 w-20 rounded-md bg-line" />
              </div>
              <div className="h-4 w-20 rounded-md bg-line" />
              <div className="ml-auto h-6 w-20 rounded-full bg-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
