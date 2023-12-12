import { Skeleton } from "../../ui/skeleton";

const SkeletonGrid = () => {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-6">
      {Array.from({ length: 12 }, (_, i) => (
        <Skeleton key={i} className="h-[300px]" />
      ))}
    </div>
  );
};

export { SkeletonGrid };
