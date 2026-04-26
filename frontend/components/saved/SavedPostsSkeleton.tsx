// components/saved/SavedPostsSkeleton.tsx
export function SavedPostsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-primary-500/10 bg-card"
        >
          <div className="animate-pulse">
            <div className="h-48 w-full bg-primary-500/10" />
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-500/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-primary-500/10" />
                  <div className="h-3 w-32 rounded bg-primary-500/10" />
                </div>
              </div>
              <div className="mt-4 h-6 w-3/4 rounded bg-primary-500/10" />
              <div className="mt-2 space-y-2">
                <div className="h-4 w-full rounded bg-primary-500/10" />
                <div className="h-4 w-5/6 rounded bg-primary-500/10" />
                <div className="h-4 w-4/6 rounded bg-primary-500/10" />
              </div>
              <div className="mt-4 h-4 w-20 rounded bg-primary-500/10" />
              <div className="mt-4 flex items-center gap-4 border-t border-primary-500/10 pt-4">
                <div className="h-8 w-16 rounded bg-primary-500/10" />
                <div className="h-8 w-16 rounded bg-primary-500/10" />
                <div className="h-8 w-16 rounded bg-primary-500/10" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}