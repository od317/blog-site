// components/post/PostSkeleton.tsx
export function PostSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Back button skeleton */}
      <div className="h-10 w-24 rounded-lg bg-primary-500/10" />

      {/* Post card skeleton */}
      <div className="rounded-xl border border-primary-500/10 bg-card p-6">
        {/* Author section */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-500/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-primary-500/10" />
            <div className="h-3 w-24 rounded bg-primary-500/10" />
          </div>
        </div>

        {/* Title skeleton */}
        <div className="mb-3 h-8 w-3/4 rounded bg-primary-500/10" />

        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-primary-500/10" />
          <div className="h-4 w-full rounded bg-primary-500/10" />
          <div className="h-4 w-3/4 rounded bg-primary-500/10" />
          <div className="h-4 w-full rounded bg-primary-500/10" />
          <div className="h-4 w-5/6 rounded bg-primary-500/10" />
        </div>

        {/* Action buttons skeleton */}
        <div className="mt-4 flex gap-4 border-t border-primary-500/10 pt-4">
          <div className="h-8 w-16 rounded bg-primary-500/10" />
          <div className="h-8 w-20 rounded bg-primary-500/10" />
          <div className="h-8 w-20 rounded bg-primary-500/10" />
        </div>
      </div>

    </div>
  );
}