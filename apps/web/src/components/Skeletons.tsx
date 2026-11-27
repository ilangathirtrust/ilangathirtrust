export function HeroSkeleton() {
  return (
    <div className="container-max py-12 lg:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="skeleton-box h-6 w-48" />
          <div className="skeleton-box h-12 w-full max-w-lg" />
          <div className="skeleton-box h-12 w-3/4" />
          <div className="skeleton-box h-20 w-full max-w-md" />
          <div className="flex gap-3 pt-2">
            <div className="skeleton-box h-12 w-40" />
            <div className="skeleton-box h-12 w-36" />
          </div>
        </div>
        <div className="skeleton-box h-80 w-full rounded-3xl lg:h-[420px]" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="skeleton-box h-48 w-full rounded-xl" />
          <div className="mt-4 space-y-2.5">
            <div className="skeleton-box h-4 w-24" />
            <div className="skeleton-box h-6 w-4/5" />
            <div className="skeleton-box h-4 w-full" />
            <div className="skeleton-box h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FolderGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl">
            <div className="skeleton-box h-28 w-full" />
            <div className="skeleton-box h-28 w-full" />
            <div className="skeleton-box h-28 w-full" />
            <div className="skeleton-box h-28 w-full" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="skeleton-box h-5 w-3/4" />
            <div className="skeleton-box h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="container-max py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="skeleton-box h-5 w-40" />
        <div className="skeleton-box h-12 w-full" />
        <div className="skeleton-box h-72 w-full rounded-3xl sm:h-96" />
        <div className="space-y-3 pt-4">
          <div className="skeleton-box h-4 w-full" />
          <div className="skeleton-box h-4 w-full" />
          <div className="skeleton-box h-4 w-5/6" />
          <div className="skeleton-box h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}
