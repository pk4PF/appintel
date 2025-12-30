export default function Loading() {
  return (
    <div className="min-h-screen bg-[#171717] text-white">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-[#171717]/90 backdrop-blur-xl border-b border-white/5 px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="h-12 w-64 bg-white/5 rounded-2xl animate-pulse mb-4"></div>
          <div className="h-6 w-96 bg-white/5 rounded-xl animate-pulse mx-auto"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div
                key={i}
                className="flex flex-col p-6 bg-white/5 rounded-3xl border border-white/5 h-[160px]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-white/10 rounded-lg animate-pulse"></div>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="h-3 w-24 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-4 w-4 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
