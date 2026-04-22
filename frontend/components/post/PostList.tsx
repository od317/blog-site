// components/post/PostList.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePostStore } from "@/lib/store/postStore";
import { PostCard } from "./PostCard";
import { PostSkeleton } from "./PostSkeleton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";

export function PostList() {
  const { posts, isLoading, isFetchingMore, error, hasMore, fetchMorePosts } =
    usePostStore();

  const observerRef = useRef<IntersectionObserver>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
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
      rootMargin: "100px", // Start loading before reaching the element
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
      <div className="space-y-6">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-4 text-center text-red-600">
        <p className="font-medium">Error loading posts</p>
        <p className="mt-1 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </Card>
    );
  }

  // Empty state
  if (posts.length === 0 && !isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 h-16 w-16 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No posts yet</h3>
        <p className="mt-1 text-gray-500">
          Be the first to share your thoughts with the community!
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
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
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              You are all caught up! 🎉
            </div>
          </div>
        )}

        {hasMore && !isFetchingMore && (
          <div className="text-center text-sm text-gray-400">
            Scroll for more posts
          </div>
        )}
      </div>
    </>
  );
}
