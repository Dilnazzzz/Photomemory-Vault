import { Skeleton } from "./ui/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-6 w-3/4" />
    </div>
  );
}
