// components/skeletons/NavbarSkeleton.tsx
export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-primary-500/20 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo skeleton */}
          <div className="h-7 w-28 bg-primary-500/10 rounded animate-pulse" />

          {/* Navigation items skeleton */}
          <nav className="flex items-center gap-2">
            <div className="h-9 w-9 bg-primary-500/10 rounded-lg animate-pulse" />
            <div className="h-9 w-16 bg-primary-500/10 rounded-lg animate-pulse hidden sm:block" />
            <div className="h-9 w-9 bg-primary-500/10 rounded-full animate-pulse" />
            <div className="h-9 w-20 bg-primary-500/10 rounded-lg animate-pulse" />
            <div className="h-9 w-9 bg-primary-500/10 rounded-lg animate-pulse" />
          </nav>
        </div>
      </div>
    </header>
  );
}