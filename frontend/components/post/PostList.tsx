// components/post/PostList.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePostStore } from "@/lib/store/postStore";
import { PostCard } from "./PostCard";
import { PostSkeleton } from "./PostSkeleton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { FileText, CheckCircle2 } from "lucide-react";

export function PostList() {
  const { posts, isLoading, isFetchingMore, error, hasMore, fetchMorePosts } =
    usePostStore();

  const observerRef = useRef<IntersectionObserver>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isFetchingMore && !isLoading) {
        console.log("📜 Loading more posts...");
        fetchMorePosts();
      }
    },
    [hasMore, isFetchingMore, isLoading, fetchMorePosts],
  );

  useEffect(() => {
    const currentElement = loadMoreRef.current;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });

    if (currentElement) {
      observerRef.current.observe(currentElement);
    }

    return () => {
      if (observerRef.current && currentElement) {
        observerRef.current.unobserve(currentElement);
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Loading state - initial
  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6 text-center border-accent-500/30">
        <div className="text-accent-400 mb-3">
          <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <p className="font-semibold text-foreground">Error loading posts</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg border border-primary-500/30 px-4 py-2 text-sm font-medium text-primary-400 hover:bg-primary-500/10 transition-all"
        >
          Try again
        </button>
      </Card>
    );
  }

  // Empty state
  if (posts.length === 0 && !isLoading) {
    return (
      <Card className="p-8 text-center border-primary-500/20">
        <div className="mx-auto mb-4 text-primary-400">
          <FileText className="h-16 w-16 mx-auto opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No posts yet</h3>
        <p className="mt-1 text-muted-foreground">
          Be the first to share your thoughts with the community!
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {posts.map((post, index) => (
          <PostCard
            key={`${post.id}-${post.updated_at || index}`}
            post={post}
          />
        ))}
      </div>

      {/* Infinite scroll trigger and loading indicator */}
      <div ref={loadMoreRef} className="py-8">
        {isFetchingMore && (
          <div className="flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/5 px-4 py-2 text-sm text-primary-400">
              <CheckCircle2 className="h-4 w-4" />
              You are all caught up! 🎉
            </div>
          </div>
        )}

        {hasMore && !isFetchingMore && (
          <div className="text-center">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-1 w-1 rounded-full bg-primary-400 animate-pulse" />
              Scroll for more posts
            </p>
          </div>
        )}
      </div>
    </>
  );
}