// components/profile/ProfilePosts.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Post, PostsResponse, PaginationData } from "@/types/Post";
import { PostCard } from "@/components/post/PostCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { api } from "@/lib/api/client";

const POSTS_PER_PAGE = 10;

interface ProfilePostsProps {
  username: string;
  initialData: PostsResponse;
}

export function ProfilePosts({ username, initialData }: ProfilePostsProps) {
  const [posts, setPosts] = useState<Post[]>(initialData.posts);
  const [pagination, setPagination] = useState<PaginationData>(
    initialData.pagination,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !pagination.hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const nextOffset = pagination.offset + POSTS_PER_PAGE;

      // ✅ Use your existing API client
      const data = await api.get<PostsResponse>(
        `/profile/${username}/posts?limit=${POSTS_PER_PAGE}&offset=${nextOffset}`,
      );

      setPosts((prev) => [...prev, ...data.posts]);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to load more posts:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load more posts",
      );
    } finally {
      setIsLoading(false);
    }
  }, [username, pagination, isLoading]);

  // Intersection Observer setup
  useEffect(() => {
    const currentElement = loadMoreRef.current;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "100px" },
    );

    if (currentElement) {
      observerRef.current.observe(currentElement);
    }

    return () => {
      if (observerRef.current && currentElement) {
        observerRef.current.unobserve(currentElement);
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, pagination.hasMore, isLoading]);

  // Error state (only show if no posts loaded)
  if (error && posts.length === 0) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-8">
        {isLoading && (
          <div className="flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        )}

        {!pagination.hasMore && posts.length > 0 && (
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
              You have reached the end 🎉
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
