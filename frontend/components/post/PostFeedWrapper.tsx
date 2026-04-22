// components/post/PostFeedWrapper.tsx
"use client";

import { useEffect, useRef } from "react";
import { PostList } from "./PostList";
import { usePostStore } from "@/lib/store/postStore";
import { useRealtime } from "@/lib/hooks/useRealtime";

interface PostFeedWrapperProps {
  initialSort: string;
}

export function PostFeedWrapper({ initialSort }: PostFeedWrapperProps) {
  const { fetchPosts, resetPagination, currentSort } = usePostStore();
  const hasInitialized = useRef(false);

  // Enable real-time updates
  useRealtime();

  // Handle sort changes
  useEffect(() => {
    if (currentSort !== initialSort) {
      resetPagination();
      fetchPosts(initialSort);
    }
  }, [initialSort, currentSort, fetchPosts, resetPagination]);

  // Initial fetch
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchPosts(initialSort);
    }
  }, [initialSort, fetchPosts]);

  return <PostList />;
}
