import { FolderGridSkeleton, PageHeaderSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="bg-sand-50">
      <PageHeaderSkeleton />
      <div className="container-max py-14">
        <FolderGridSkeleton count={6} />
      </div>
    </div>
  );
}
