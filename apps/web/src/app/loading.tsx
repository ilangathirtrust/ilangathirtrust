import { HeroSkeleton, MarqueeSkeleton, SectionCardGridSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="bg-white">
      <HeroSkeleton />
      <MarqueeSkeleton />
      <SectionCardGridSkeleton count={3} />
    </div>
  );
}
