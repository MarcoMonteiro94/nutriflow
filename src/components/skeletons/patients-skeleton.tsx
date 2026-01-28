import { Skeleton } from "@/components/ui/skeleton";

export function PatientCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border p-4 sm:p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Skeleton className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-5 rounded" />
          </div>

          {/* Contact & Goal */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-7 w-14 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="hidden lg:block">
      <div className="sticky top-6 space-y-4">
        {/* Stats Card */}
        <div className="bg-card rounded-2xl border overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-card rounded-2xl border p-4">
          <Skeleton className="h-4 w-40 mb-3" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl border p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-full rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatientsListSkeleton() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-full sm:w-44 rounded-full" />
      </div>

      {/* Search */}
      <div className="mb-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Patients Grid */}
        <div className="order-2 lg:order-1">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <PatientCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="order-1 lg:order-2">
          <SidebarSkeleton />
        </div>
      </div>
    </div>
  );
}
