// components/profile/ProfilePosts.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Post, PostsResponse, PaginationData } from "@/types/Post";
import { PostCard } from "@/components/post/PostCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { api } from "@/lib/api/client";
import { CheckCircle2, AlertCircle } from "lucide-react";

const POSTS_PER_PAGE = 10;

interface ProfilePostsProps {
  username: string;
  initialData: PostsResponse;
}

export function ProfilePosts({ username, initialData }: ProfilePostsProps) {
  const [posts, setPosts] = useState<Post[]>(initialData.posts);
  console.log('posts for profile are',posts)
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

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-accent-400 mx-auto mb-3" />
        <p className="text-accent-400 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-primary-400 hover:text-primary-300 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-primary-500/10 bg-card p-12 text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <div className="rounded-full border-2 border-primary-500/20 p-3">
            <svg
              className="h-8 w-8 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
        </div>
        <p className="text-muted-foreground">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/10 bg-primary-500/5 px-4 py-2 text-sm text-primary-400">
              <CheckCircle2 className="h-4 w-4" />
              You have reached the end 🎉
            </div>
          </div>
        )}

        {pagination.hasMore && !isLoading && (
          <div className="text-center">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-1 w-1 rounded-full bg-primary-400 animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
              Scroll for more posts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}