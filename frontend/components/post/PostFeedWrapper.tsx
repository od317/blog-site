// components/post/PostFeedWrapper.tsx
"use client";

import { useEffect, useRef } from "react";
import { PostList } from "./PostList";
import { usePostStore } from "@/lib/store/postStore";
import { Post } from "@/types/Post";

interface PostFeedWrapperProps {
  initialSort: string;
  initialPosts: Post[];
}

export function PostFeedWrapper({
  initialSort,
  initialPosts,
}: PostFeedWrapperProps) {
  const { fetchMorePosts } = usePostStore();
  const hasInitialized = useRef(false);

  // Sync SSR posts to store on mount
  useEffect(() => {
    if (!hasInitialized.current && initialPosts.length > 0) {
      console.log(`📡 Syncing ${initialPosts.length} SSR posts to store`);
      usePostStore.setState({
        posts: initialPosts,
        isLoading: false,
        hasMore: initialPosts.length === 10,
        currentOffset: initialPosts.length,
        currentSort: initialSort,
      });
      hasInitialized.current = true;
    }
  }, [initialPosts, initialSort]);

  // Handle sort changes
  useEffect(() => {
    if (!hasInitialized.current) return;

    const currentSort = usePostStore.getState().currentSort;

    if (currentSort !== initialSort) {
      console.log(`🔄 Sort changed from ${currentSort} to ${initialSort}`);
      usePostStore.setState({
        isLoading: true,
        error: null,
        posts: [],
        currentSort: initialSort,
        currentOffset: 0,
        hasMore: true,
      });
      fetchMorePosts(initialSort);
    }
  }, [initialSort, fetchMorePosts]);

  return <PostList initialPosts={initialPosts} />;
}
