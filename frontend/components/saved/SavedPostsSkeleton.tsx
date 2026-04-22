// components/saved/SavedPostsSkeleton.tsx
export function SavedPostsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="animate-pulse">
            <div className="h-48 w-full bg-gray-200" />
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="mt-1 h-3 w-32 rounded bg-gray-200" />
                </div>
              </div>
              <div className="mt-4 h-6 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 space-y-2">
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-5/6 rounded bg-gray-200" />
                <div className="h-4 w-4/6 rounded bg-gray-200" />
              </div>
              <div className="mt-4 h-4 w-20 rounded bg-gray-200" />
              <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
                <div className="h-8 w-16 rounded bg-gray-200" />
                <div className="h-8 w-16 rounded bg-gray-200" />
                <div className="h-8 w-16 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
