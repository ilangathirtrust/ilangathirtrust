import { CardGridSkeleton, HeroSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div>
      <HeroSkeleton />
      <div className="container-max py-12">
        <CardGridSkeleton count={6} />
      </div>
    </div>
  );
}
