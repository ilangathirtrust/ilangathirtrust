import { SectionCardGridSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="bg-sand-50">
      <div className="border-b border-sand-200 bg-sand-100/70 py-10 sm:py-12">
        <div className="container-max space-y-3">
          <div className="skeleton-box h-4 w-32 rounded-full" />
          <div className="skeleton-box h-9 w-64 max-w-full" />
          <div className="skeleton-box h-5 w-96 max-w-full" />
        </div>
      </div>
      <SectionCardGridSkeleton count={3} />
    </div>
  );
}
