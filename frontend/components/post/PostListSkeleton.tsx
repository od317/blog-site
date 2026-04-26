// components/post/PostListSkeleton.tsx
export default function PostListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-primary-500/10 bg-card p-6 space-y-4"
        >
          {/* Author row */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-500/10 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-primary-500/10 rounded animate-pulse" />
              <div className="h-3 w-16 bg-primary-500/10 rounded animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="h-6 w-3/4 bg-primary-500/10 rounded animate-pulse" />

          {/* Content lines */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-primary-500/10 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-primary-500/10 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-primary-500/10 rounded animate-pulse" />
          </div>

          {/* Tags */}
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-accent-500/10 rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-primary-500/10 rounded-full animate-pulse" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-2 border-t border-primary-500/10">
            <div className="h-8 w-16 bg-primary-500/10 rounded animate-pulse" />
            <div className="h-8 w-16 bg-primary-500/10 rounded animate-pulse" />
            <div className="h-8 w-16 bg-primary-500/10 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}