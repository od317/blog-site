"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProfilePost, PaginationData, PostsResponse } from "@/types/Post";
import { LikeButton } from "@/components/post/LikeButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { api } from "@/lib/api/client";

interface ProfilePostsProps {
  username: string;
  initialPosts?: ProfilePost[];
  initialPagination?: PaginationData;
}

const POSTS_PER_PAGE = 10;

// ============================================
// SIMPLE DATE FORMATTER
// ============================================
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffWeeks < 4)
    return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

// ============================================
// INTERSECTION OBSERVER
// ============================================
function useIntersectionObserver(
  callback: () => void,
  hasMore: boolean,
  isLoading: boolean,
) {
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 0, rootMargin: "100px" },
    );

    const sentinel = document.getElementById("load-more-sentinel");
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [callback, hasMore, isLoading]);
}

export function ProfilePosts({
  username,
  initialPosts = [],
  initialPagination,
}: ProfilePostsProps) {
  const [posts, setPosts] = useState<ProfilePost[]>(initialPosts);
  const [pagination, setPagination] = useState<PaginationData | null>(
    initialPagination || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(initialPosts.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (offset: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<PostsResponse>(
          `/profile/${username}/posts?limit=${POSTS_PER_PAGE}&offset=${offset}`,
        );
        return response;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [username],
  );

  const loadMore = useCallback(async () => {
    if (isLoading || !pagination?.hasMore) return;

    const nextOffset = (pagination.offset || 0) + POSTS_PER_PAGE;
    const data = await fetchPosts(nextOffset);

    if (data) {
      setPosts((prev) => [...prev, ...data.posts]);
      setPagination(data.pagination);
    }
  }, [isLoading, pagination, fetchPosts]);

  // Initial load
  useEffect(() => {
    if (initialPosts.length === 0 && !pagination) {
      const loadInitialPosts = async () => {
        setIsInitialLoad(true);
        const data = await fetchPosts(0);
        if (data) {
          setPosts(data.posts);
          setPagination(data.pagination);
        }
        setIsInitialLoad(false);
      };
      loadInitialPosts();
    }
  }, [fetchPosts, initialPosts.length, pagination]);

  useIntersectionObserver(loadMore, pagination?.hasMore || false, isLoading);

  if (isInitialLoad) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article
          key={post.id}
          className="group overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <Link href={`/posts/${post.id}`} className="block">
            {/* Featured Image */}
            {post.image_url && (
              <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                <Image
                  src={post.image_url}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}

            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {post.title}
              </h2>

              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                <span>{formatRelativeTime(post.created_at)}</span>
                <span>•</span>
                <span>{post.readingTime}</span>
              </div>

              <p className="mt-3 text-gray-600 line-clamp-3">{post.excerpt}</p>

              <div className="mt-4 flex items-center gap-4 pt-3 border-t border-gray-100">
                <LikeButton
                  postId={post.id}
                  initialLikeCount={post.like_count}
                  initialHasLiked={post.user_has_liked}
                />
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-sm">{post.comment_count}</span>
                </button>
              </div>
            </div>
          </Link>
        </article>
      ))}

      {isLoading && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Sentinel element for infinite scroll */}
      {pagination?.hasMore && !isLoading && (
        <div id="load-more-sentinel" className="h-10" />
      )}

      {!pagination?.hasMore && posts.length > 0 && (
        <div className="py-8 text-center text-sm text-gray-400">
          You have reached the end
        </div>
      )}
    </div>
  );
}
