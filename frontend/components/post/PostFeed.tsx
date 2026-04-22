// components/post/PostFeed.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PostCard } from "./PostCard";
import { PostSkeleton } from "./PostSkeleton";
import { fetchMorePosts } from "../../app/actions/post.actions";
import { useRealtime } from "@/lib/hooks/useRealtime";
import { usePostStore } from "@/lib/store/postStore";
import type { Post } from "@/types/Post";

interface PostFeedProps {
  initialPosts: Post[];
  currentSort: string;
}

export function PostFeed({ initialPosts, currentSort }: PostFeedProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver>(null);
  const lastPostRef = useRef<HTMLDivElement>(null);

  // Enable real-time updates
  useRealtime();

  // Sync with global store for real-time updates
  const globalPosts = usePostStore((state) => state.posts);

  useEffect(() => {
    if (globalPosts.length > 0) {
      setPosts(globalPosts);
    }
  }, [globalPosts]);

  // Reset when sort changes
  useEffect(() => {
    setPosts(initialPosts);
    setPage(1);
    setHasMore(true);
  }, [currentSort, initialPosts]);

  // Infinite scroll with Intersection Observer
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const result = await fetchMorePosts({
        page: nextPage,
        sort: currentSort,
      });

      if (result.posts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => [...prev, ...result.posts]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, hasMore, isLoading, currentSort]);

  // Setup intersection observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    });

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMore, hasMore, isLoading]);

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">
          No posts yet. Be the first to create one!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post, index) => (
        <div
          key={post.id}
          ref={index === posts.length - 1 ? lastPostRef : null}
        >
          <PostCard post={post} />
        </div>
      ))}

      {isLoading && (
        <div className="space-y-6">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="py-4 text-center text-sm text-gray-500">
          You have reached the end! 🎉
        </p>
      )}
    </div>
  );
}
