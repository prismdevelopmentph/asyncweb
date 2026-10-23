export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative z-10 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-4 w-12 bg-zinc-800/80 rounded" />
          <div className="h-3 w-3 bg-zinc-800/80 rounded" />
          <div className="h-4 w-16 bg-zinc-800/80 rounded" />
          <div className="h-3 w-3 bg-zinc-800/80 rounded" />
          <div className="h-4 w-32 bg-zinc-800/80 rounded" />
        </div>

        {/* 2-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-8">
            {/* Hero Visual Card */}
            <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur space-y-6">
              <div className="flex justify-between items-center">
                <div className="h-6 w-28 bg-zinc-800/80 rounded-full" />
                <div className="h-4 w-40 bg-zinc-800/80 rounded" />
              </div>
              <div className="aspect-[16/9] w-full rounded-2xl bg-zinc-900 border border-zinc-800/60" />
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                  <div className="h-3 w-14 bg-zinc-800/80 rounded" />
                  <div className="h-4 w-20 bg-zinc-800/80 rounded" />
                </div>
              ))}
            </div>

            {/* Features Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="h-4 w-48 bg-zinc-800/80 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-zinc-950/60 border border-zinc-800/60 rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Purchase Column) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-zinc-900/70 border border-zinc-800/90 p-6 sm:p-8 backdrop-blur shadow-2xl space-y-6">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-zinc-800/80 rounded" />
                <div className="h-7 w-3/4 bg-zinc-800/80 rounded" />
              </div>

              {/* Price Skeleton */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="h-3 w-16 bg-zinc-800/80 rounded" />
                  <div className="h-8 w-28 bg-zinc-850 bg-zinc-800 rounded" />
                </div>
                <div className="h-8 w-24 bg-zinc-900 border border-zinc-800 rounded-xl" />
              </div>

              {/* Variant Selectors */}
              <div className="space-y-3">
                <div className="h-3 w-28 bg-zinc-800/80 rounded" />
                <div className="grid grid-cols-2 gap-2.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl" />
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="h-14 w-full bg-purple-600/30 rounded-2xl border border-purple-500/20" />

              {/* Payment Methods */}
              <div className="pt-2 space-y-2">
                <div className="h-3 w-32 bg-zinc-800/80 rounded" />
                <div className="flex gap-2">
                  <div className="h-7 w-28 bg-zinc-950 border border-zinc-800/70 rounded-lg" />
                  <div className="h-7 w-20 bg-zinc-950 border border-zinc-800/70 rounded-lg" />
                  <div className="h-7 w-24 bg-zinc-950 border border-zinc-800/70 rounded-lg" />
                </div>
              </div>

              {/* Trust Checklist */}
              <div className="pt-4 border-t border-zinc-800/80 space-y-2.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 w-44 bg-zinc-850 bg-zinc-800/60 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
