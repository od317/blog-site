export function CreatePostSkeleton() {
  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 animate-pulse">
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="mt-1 h-4 w-48 rounded bg-gray-200" />
      </div>
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded bg-gray-100" />
        <div className="h-32 animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
