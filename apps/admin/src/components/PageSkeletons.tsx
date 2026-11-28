export function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      {/* Live Donation Switch Strip */}
      <div className="admin-card flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-44 rounded-full admin-skeleton" />
          <div className="h-4 w-72 max-w-full rounded-lg admin-skeleton" />
        </div>
        <div className="h-9 w-36 shrink-0 rounded-xl admin-skeleton" />
      </div>

      {/* 8 Compact KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="admin-card space-y-2.5 p-3.5 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3.5 w-24 rounded-md admin-skeleton" />
              <div className="h-8 w-8 shrink-0 rounded-lg admin-skeleton" />
            </div>
            <div className="h-6 w-20 rounded-lg admin-skeleton" />
            <div className="h-3 w-16 rounded-md admin-skeleton" />
          </div>
        ))}
      </div>

      {/* Quick Shortcuts */}
      <div className="admin-card space-y-3">
        <div className="h-4 w-40 rounded-md admin-skeleton" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl admin-skeleton" />
          ))}
        </div>
      </div>

      {/* Recent Donations + Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, cardIdx) => (
          <div key={cardIdx} className="admin-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 rounded-md admin-skeleton" />
              <div className="h-3.5 w-20 rounded-md admin-skeleton" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, rowIdx) => (
                <div key={rowIdx} className="h-12 rounded-xl admin-skeleton" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PagesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-xl admin-skeleton" />
          ))}
        </div>
        <div className="h-9 w-32 rounded-xl admin-skeleton" />
      </div>

      <div className="admin-card space-y-4">
        <div className="space-y-1.5">
          <div className="h-5 w-52 rounded-md admin-skeleton" />
          <div className="h-3.5 w-80 max-w-full rounded-md admin-skeleton" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-28 rounded admin-skeleton" />
              <div className="h-10 rounded-xl admin-skeleton" />
            </div>
          ))}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={`ta-${i}`} className="space-y-1.5">
              <div className="h-3 w-28 rounded admin-skeleton" />
              <div className="h-20 rounded-xl admin-skeleton" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 min-w-[200px] flex-1 rounded-xl admin-skeleton" />
          <div className="h-10 w-36 rounded-xl admin-skeleton" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-40 rounded-xl admin-skeleton" />
        </div>
      </div>
    </div>
  );
}

export function EventsActivitiesSkeleton({ isTeam = false }: { isTeam?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="admin-card space-y-4">
        <div className="h-5 w-44 rounded-md admin-skeleton" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: isTeam ? 4 : 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-24 rounded admin-skeleton" />
              <div className="h-10 rounded-xl admin-skeleton" />
            </div>
          ))}
        </div>
        {!isTeam && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-20 rounded-xl admin-skeleton" />
            <div className="h-20 rounded-xl admin-skeleton" />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <div className="h-10 min-w-[180px] flex-1 rounded-xl admin-skeleton" />
          <div className="h-10 w-32 rounded-xl admin-skeleton" />
          <div className="h-10 w-28 rounded-xl admin-skeleton" />
        </div>
      </div>

      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="admin-card flex items-center justify-between gap-4 p-3.5 sm:p-4">
            <div className="space-y-1.5">
              <div className="h-4 w-48 max-w-full rounded admin-skeleton" />
              <div className="h-3 w-28 rounded admin-skeleton" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-16 rounded-full admin-skeleton" />
              <div className="h-8 w-14 rounded-lg admin-skeleton" />
              <div className="h-8 w-8 rounded-lg admin-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GallerySkeleton() {
  return (
    <div className="space-y-4">
      <div className="admin-card space-y-4">
        <div className="h-5 w-56 rounded-md admin-skeleton" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl admin-skeleton" />
          ))}
          <div className="h-16 rounded-xl admin-skeleton sm:col-span-2" />
          <div className="h-10 self-end rounded-xl admin-skeleton" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="admin-card space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl admin-skeleton" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded admin-skeleton" />
                  <div className="h-3 w-24 rounded admin-skeleton" />
                </div>
              </div>
              <div className="h-7 w-7 rounded-lg admin-skeleton" />
            </div>
            <div className="h-3 w-24 rounded admin-skeleton" />
            <div className="h-9 w-full rounded-xl admin-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlogSkeleton() {
  return (
    <div className="space-y-4">
      <div className="admin-card space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-44 rounded-md admin-skeleton" />
          <div className="h-8 w-24 rounded-xl admin-skeleton" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl admin-skeleton" />
          ))}
          <div className="h-16 rounded-xl admin-skeleton" />
          <div className="h-16 rounded-xl admin-skeleton" />
          <div className="h-28 rounded-xl admin-skeleton" />
          <div className="h-28 rounded-xl admin-skeleton" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-10 min-w-[180px] flex-1 rounded-xl admin-skeleton" />
          <div className="h-10 w-32 rounded-xl admin-skeleton" />
        </div>
      </div>

      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="admin-card flex items-center justify-between gap-3 p-3.5 sm:p-4">
            <div className="space-y-1.5">
              <div className="h-4 w-52 max-w-full rounded admin-skeleton" />
              <div className="h-3 w-36 rounded admin-skeleton" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-16 rounded-full admin-skeleton" />
              <div className="h-8 w-14 rounded-lg admin-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MediaSkeleton() {
  return (
    <div className="space-y-4">
      <div className="admin-card space-y-3">
        <div className="flex flex-wrap gap-2.5">
          <div className="h-10 w-36 rounded-xl admin-skeleton" />
          <div className="h-10 w-48 rounded-xl admin-skeleton" />
        </div>
        <div className="h-32 w-full rounded-2xl admin-skeleton" />
      </div>

      <div className="admin-card flex flex-wrap items-center gap-2.5 p-3.5">
        <div className="h-10 min-w-[180px] flex-1 rounded-xl admin-skeleton" />
        <div className="h-10 w-32 rounded-xl admin-skeleton" />
        <div className="h-10 w-24 rounded-xl admin-skeleton" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="admin-card overflow-hidden p-0">
            <div className="h-36 w-full admin-skeleton" />
            <div className="space-y-2 p-3">
              <div className="h-3.5 w-3/4 rounded admin-skeleton" />
              <div className="h-3 w-1/2 rounded admin-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NavigationSkeleton() {
  return (
    <div className="space-y-4">
      <div className="admin-card space-y-4">
        <div className="space-y-1.5">
          <div className="h-5 w-56 rounded-md admin-skeleton" />
          <div className="h-3.5 w-72 max-w-full rounded admin-skeleton" />
        </div>
        <div className="admin-subcard grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl admin-skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl admin-skeleton" />
          ))}
        </div>
      </div>

      <div className="admin-card space-y-4">
        <div className="h-5 w-48 rounded-md admin-skeleton" />
        <div className="admin-subcard grid gap-2.5 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl admin-skeleton" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg admin-skeleton" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DonationsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="admin-card flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl admin-skeleton" />
          <div className="space-y-1.5">
            <div className="h-4 w-52 rounded admin-skeleton" />
            <div className="h-3 w-72 max-w-full rounded admin-skeleton" />
          </div>
        </div>
        <div className="h-10 w-44 rounded-xl admin-skeleton" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="admin-card space-y-2 p-3.5 sm:p-4">
            <div className="h-3.5 w-20 rounded admin-skeleton" />
            <div className="h-6 w-24 rounded admin-skeleton" />
          </div>
        ))}
      </div>

      <div className="admin-card flex flex-wrap gap-2.5 p-3.5">
        <div className="h-10 min-w-[180px] flex-1 rounded-xl admin-skeleton" />
        <div className="h-10 w-32 rounded-xl admin-skeleton" />
        <div className="h-10 w-24 rounded-xl admin-skeleton" />
      </div>

      <div className="admin-card space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl admin-skeleton" />
        ))}
      </div>
    </div>
  );
}

export function InboxUsersSkeleton({ mode }: { mode: 'enquiries' | 'volunteers' | 'audit' | 'users' }) {
  return (
    <div className="space-y-3.5">
      {mode === 'users' && (
        <div className="admin-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="h-5 w-48 rounded admin-skeleton" />
            <div className="h-6 w-40 rounded-full admin-skeleton" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl admin-skeleton" />
            ))}
          </div>
          <div className="flex justify-end">
            <div className="h-9 w-32 rounded-xl admin-skeleton" />
          </div>
        </div>
      )}

      {Array.from({ length: mode === 'audit' ? 6 : 4 }).map((_, i) => (
        <div
          key={i}
          className={`admin-card flex flex-wrap items-center justify-between gap-3 ${
            mode === 'audit' ? 'p-3.5' : 'p-4'
          }`}
        >
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <div className="h-4 w-56 max-w-full rounded admin-skeleton" />
            <div className="h-3 w-40 rounded admin-skeleton" />
            {(mode === 'enquiries' || mode === 'volunteers') && (
              <div className="h-3 w-3/4 rounded admin-skeleton" />
            )}
          </div>
          {mode === 'audit' ? (
            <div className="h-3.5 w-28 rounded admin-skeleton" />
          ) : (
            <div className="h-9 w-32 rounded-xl admin-skeleton" />
          )}
        </div>
      ))}
    </div>
  );
}

export function SecuritySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="admin-card flex items-center gap-3 p-4">
            <div className="h-10 w-10 shrink-0 rounded-xl admin-skeleton" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-24 rounded admin-skeleton" />
              <div className="h-4 w-32 rounded admin-skeleton" />
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="space-y-1.5">
            <div className="h-5 w-48 rounded admin-skeleton" />
            <div className="h-3 w-64 max-w-full rounded admin-skeleton" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col justify-between gap-3 py-2.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl admin-skeleton" />
              <div className="space-y-1.5">
                <div className="h-4 w-44 rounded admin-skeleton" />
                <div className="h-3 w-52 rounded admin-skeleton" />
              </div>
            </div>
            <div className="h-8 w-24 rounded-xl admin-skeleton" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card space-y-3">
          <div className="h-5 w-48 rounded admin-skeleton" />
          <div className="h-3.5 w-64 max-w-full rounded admin-skeleton" />
          <div className="h-10 w-44 rounded-xl admin-skeleton" />
        </div>
        <div className="admin-card space-y-3">
          <div className="h-5 w-40 rounded admin-skeleton" />
          <div className="h-10 rounded-xl admin-skeleton" />
          <div className="h-10 rounded-xl admin-skeleton" />
          <div className="h-9 w-36 rounded-xl admin-skeleton" />
        </div>
      </div>
    </div>
  );
}
