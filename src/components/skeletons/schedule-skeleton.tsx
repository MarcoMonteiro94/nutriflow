import { Skeleton } from "@/components/ui/skeleton";

export function AppointmentItemSkeleton() {
  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-3 bottom-0 w-[2px] bg-muted" />

      {/* Timeline dot */}
      <Skeleton className="absolute left-0 top-1 w-6 h-6 rounded-full" />

      {/* Card */}
      <div className="rounded-2xl border-2 border-muted p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-full sm:w-40 rounded-full" />
      </div>

      {/* Mobile Calendar Bar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-2 p-4 rounded-2xl border mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Timeline */}
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border p-4 sm:p-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Timeline items */}
            <div className="space-y-0">
              {[...Array(4)].map((_, i) => (
                <AppointmentItemSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Calendar Sidebar */}
        <div className="order-1 lg:order-2 hidden lg:block">
          <div className="sticky top-6 space-y-4">
            {/* Calendar Card */}
            <div className="rounded-2xl border overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Calendar grid */}
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-1">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full rounded-lg" />
                    ))}
                  </div>
                  {[...Array(5)].map((_, row) => (
                    <div key={row} className="grid grid-cols-7 gap-1">
                      {[...Array(7)].map((_, col) => (
                        <Skeleton key={col} className="h-8 w-full rounded-lg" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-4 pb-4 pt-3 border-t">
                <Skeleton className="h-3 w-32 mx-auto" />
              </div>
            </div>

            {/* Summary Card */}
            <div className="rounded-2xl border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-9 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
