export function HeroSkeleton() {
  return (
    <div className="container-max py-12 lg:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="skeleton-box h-4 w-48" />
          <div className="skeleton-box h-12 w-full max-w-xl" />
          <div className="skeleton-box h-12 w-3/4" />
          <div className="skeleton-box h-16 w-full max-w-lg" />
          <div className="flex gap-3 pt-2">
            <div className="skeleton-box h-12 w-40" />
            <div className="skeleton-box h-12 w-36" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="skeleton-box h-72 w-full rounded-2xl sm:h-[420px]" />
        </div>
      </div>
    </div>
  );
}

export function MarqueeSkeleton() {
  return (
    <section className="border-b border-slate-200 bg-white py-14" aria-hidden="true">
      <div className="container-max mb-8 flex items-end justify-between">
        <div className="space-y-2">
          <div className="skeleton-box h-3.5 w-28" />
          <div className="skeleton-box h-8 w-64" />
        </div>
        <div className="skeleton-box h-5 w-24" />
      </div>
      <div className="container-max grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-box h-56 w-full rounded-2xl" />
        ))}
      </div>
    </section>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
          <div className="skeleton-box h-48 w-full rounded-xl" />
          <div className="mt-4 space-y-2.5">
            <div className="skeleton-box h-3.5 w-24" />
            <div className="skeleton-box h-6 w-4/5" />
            <div className="skeleton-box h-4 w-full" />
            <div className="skeleton-box h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionCardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="container-max py-14 lg:py-16" aria-busy="true">
      <div className="mb-8 flex items-end justify-between">
        <div className="space-y-2">
          <div className="skeleton-box h-3.5 w-28" />
          <div className="skeleton-box h-8 w-64" />
        </div>
        <div className="skeleton-box h-5 w-24" />
      </div>
      <CardGridSkeleton count={count} />
    </div>
  );
}

export function FolderGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
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

export function SectionFolderGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="container-max py-14 lg:py-16" aria-busy="true">
      <div className="mb-8 flex items-end justify-between">
        <div className="space-y-2">
          <div className="skeleton-box h-3.5 w-28" />
          <div className="skeleton-box h-8 w-64" />
        </div>
        <div className="skeleton-box h-5 w-24" />
      </div>
      <FolderGridSkeleton count={count} />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="border-b border-slate-200 bg-white py-10 lg:py-14" aria-hidden="true">
      <div className="container-max space-y-3">
        <div className="skeleton-box h-4 w-36" />
        <div className="skeleton-box h-10 w-full max-w-xl" />
        <div className="skeleton-box h-5 w-full max-w-2xl" />
      </div>
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="container-max py-12" aria-busy="true">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="skeleton-box h-5 w-40" />
        <div className="skeleton-box h-12 w-full" />
        <div className="skeleton-box h-72 w-full rounded-2xl sm:h-96" />
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
