export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white" suppressHydrationWarning>
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-9 w-48 bg-[#1d1d1f] rounded-lg animate-pulse"></div>
            <div className="h-6 w-32 bg-[#1d1d1f] rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-2xl bg-[#1d1d1f] border border-white/10"
            >
              <div className="h-5 w-5 bg-[#2d2d2d] rounded animate-pulse"></div>
              <div className="w-[72px] h-[72px] bg-[#2d2d2d] rounded-[16px] animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-[#2d2d2d] rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-[#2d2d2d] rounded animate-pulse"></div>
                <div className="h-4 w-1/3 bg-[#2d2d2d] rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-[#2d2d2d] rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

