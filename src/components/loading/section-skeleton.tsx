import { Skeleton } from "@/components/ui/skeleton";

export function SectionSkeleton() {
  return (
    <div className="p-6 space-y-4" role="status" aria-label="Loading content">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="space-y-2 mt-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <span className="sr-only">Loading section content...</span>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 space-y-3"
      role="status"
      aria-label="Loading card"
    >
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <span className="sr-only">Loading card...</span>
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
      <span className="sr-only">Loading list items...</span>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading editor">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
      <Skeleton className="h-64 w-full" />
      <span className="sr-only">Loading editor...</span>
    </div>
  );
}
