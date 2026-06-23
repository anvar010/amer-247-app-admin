export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-20 rounded-lg bg-line" />
        <div className="h-4 w-72 rounded-md bg-line" />
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-surface p-5 shadow-sm">
            <div className="mb-3 h-2 w-10 rounded-full bg-line" />
            <div className="h-8 w-28 rounded-md bg-line" />
            <div className="mt-2 h-3 w-24 rounded-md bg-line" />
          </div>
        ))}
      </div>

      {/* Config form card */}
      <div className="rounded-2xl bg-surface p-5 shadow-sm">
        <div className="h-5 w-32 rounded-md bg-line mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 rounded-[9px] bg-line" />
          <div className="h-10 rounded-[9px] bg-line" />
        </div>
        <div className="mt-3 h-10 w-28 rounded-[9px] bg-line" />
      </div>

      {/* Cashback form card */}
      <div className="rounded-2xl bg-surface p-5 shadow-sm">
        <div className="h-5 w-36 rounded-md bg-line mb-4" />
        <div className="flex gap-4">
          <div className="h-10 flex-1 rounded-[9px] bg-line" />
          <div className="h-10 flex-1 rounded-[9px] bg-line" />
          <div className="h-10 w-28 rounded-[9px] bg-line" />
        </div>
      </div>

      {/* Transactions table */}
      <div className="rounded-2xl bg-surface shadow-sm">
        <div className="border-b border-line-2 px-6 py-4">
          <div className="h-5 w-40 rounded-md bg-line" />
          <div className="mt-1 h-3 w-56 rounded-md bg-line" />
        </div>
        <div className="flex flex-col divide-y divide-line-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-6 py-3.5">
              <div className="h-5 w-20 rounded-md bg-line" />
              <div className="h-6 w-16 rounded-full bg-line" />
              <div className="h-4 w-16 rounded-md bg-line" />
              <div className="h-4 w-32 rounded-md bg-line" />
              <div className="h-4 w-12 rounded-md bg-line" />
              <div className="ml-auto h-4 w-28 rounded-md bg-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
