export function PostSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Back button skeleton */}
      <div className="mb-4 h-10 w-24 rounded-lg bg-gray-200" />

      {/* Post card skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {/* Author section */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="mt-1 h-3 w-24 rounded bg-gray-200" />
          </div>
        </div>

        {/* Title skeleton */}
        <div className="mb-3 h-8 w-3/4 rounded bg-gray-200" />

        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-5/6 rounded bg-gray-200" />
        </div>

        {/* Action buttons skeleton */}
        <div className="mt-4 flex gap-4 border-t pt-4">
          <div className="h-8 w-16 rounded bg-gray-200" />
          <div className="h-8 w-20 rounded bg-gray-200" />
        </div>
      </div>

      {/* Comments section skeleton */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-32 rounded bg-gray-200" />

        {/* Comment form skeleton */}
        <div className="mb-6 rounded-lg border p-4">
          <div className="mb-3 h-20 w-full rounded bg-gray-200" />
          <div className="h-9 w-24 rounded bg-gray-200" />
        </div>

        {/* Comments list skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="mb-1 h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
