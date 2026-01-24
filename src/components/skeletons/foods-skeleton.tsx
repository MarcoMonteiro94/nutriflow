import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FoodCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Calories */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        {/* Macros row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        {/* Portion info */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-28" />
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FoodsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Foods Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <FoodCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
