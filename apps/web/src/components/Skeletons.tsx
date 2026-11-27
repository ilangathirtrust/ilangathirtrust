export function HeroSkeleton() {
  return (
    <div className="bg-sand-50 py-10 sm:py-14 lg:py-16">
      <div className="container-max">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="skeleton-box h-5 w-44 rounded-full" />
            <div className="skeleton-box h-11 w-full max-w-xl" />
            <div className="skeleton-box h-11 w-4/5" />
            <div className="skeleton-box h-16 w-full max-w-lg" />
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="skeleton-box h-12 w-40 rounded-xl" />
              <div className="skeleton-box h-12 w-36 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-sand-200 bg-white p-2.5 shadow-sm">
              <div className="skeleton-box h-64 w-full rounded-2xl sm:h-[400px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarqueeSkeleton() {
  return (
    <section className="border-y border-sand-200 bg-white py-12 sm:py-14" aria-hidden="true">
      <div className="container-max mb-7 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton-box h-3.5 w-28" />
          <div className="skeleton-box h-8 w-56 sm:w-72" />
        </div>
        <div className="skeleton-box h-5 w-20" />
      </div>
      <div className="container-max grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-box h-48 w-full rounded-2xl sm:h-56" />
        ))}
      </div>
    </section>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-sand-200 bg-white p-4 shadow-xs">
          <div className="skeleton-box h-44 w-full rounded-xl sm:h-48" />
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
    <div className="container-max py-12 lg:py-16" aria-busy="true">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton-box h-3.5 w-28" />
          <div className="skeleton-box h-8 w-52 sm:w-72" />
        </div>
        <div className="skeleton-box h-5 w-20" />
      </div>
      <CardGridSkeleton count={count} />
    </div>
  );
}

export function FolderGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="overflow-hidden rounded-2xl border border-sand-200 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl">
            <div className="skeleton-box h-24 w-full sm:h-28" />
            <div className="skeleton-box h-24 w-full sm:h-28" />
            <div className="skeleton-box h-24 w-full sm:h-28" />
            <div className="skeleton-box h-24 w-full sm:h-28" />
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
    <div className="container-max py-12 lg:py-16" aria-busy="true">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton-box h-3.5 w-28" />
          <div className="skeleton-box h-8 w-52 sm:w-72" />
        </div>
        <div className="skeleton-box h-5 w-20" />
      </div>
      <FolderGridSkeleton count={count} />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="border-b border-sand-200 bg-sand-100/70 py-10 lg:py-14" aria-hidden="true">
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
    <div className="bg-sand-50 py-10 sm:py-14" aria-busy="true">
      <div className="container-max">
        <div className="mx-auto max-w-3xl rounded-3xl border border-sand-200 bg-white p-5 sm:p-8 space-y-6">
          <div className="skeleton-box h-5 w-40" />
          <div className="skeleton-box h-10 w-full" />
          <div className="skeleton-box h-64 w-full rounded-2xl sm:h-96" />
          <div className="space-y-3 pt-4">
            <div className="skeleton-box h-4 w-full" />
            <div className="skeleton-box h-4 w-full" />
            <div className="skeleton-box h-4 w-5/6" />
            <div className="skeleton-box h-4 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
