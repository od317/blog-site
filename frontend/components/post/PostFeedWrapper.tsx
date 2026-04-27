"use client";

import { useEffect, useRef } from "react";
import { PostList } from "./PostList";
import { usePostStore } from "@/lib/store/postStore";
import { useRealtime } from "@/lib/hooks/useRealtime";

interface PostFeedWrapperProps {
  initialSort: string;
}

export function PostFeedWrapper({ initialSort }: PostFeedWrapperProps) {
  const { fetchPosts, resetPagination, posts, isLoading } = usePostStore();
  const hasInitialized = useRef(false);
  const currentSortRef = useRef(initialSort);
  
  // Enable real-time updates
  useRealtime();

  // When sort changes, reset and fetch new data
  useEffect(() => {
    if (currentSortRef.current !== initialSort) {
      console.log(`🔄 Sort changed from ${currentSortRef.current} to ${initialSort}`);
      currentSortRef.current = initialSort;
      resetPagination();
      fetchPosts(initialSort, false);
    }
  }, [initialSort, fetchPosts, resetPagination]);

  // Initial fetch
  useEffect(() => {
    if (!hasInitialized.current && posts.length === 0) {
      hasInitialized.current = true;
      console.log(`📡 Initial fetch with sort: ${initialSort}`);
      fetchPosts(initialSort, false);
    }
  }, [initialSort, fetchPosts, posts.length]);

  return <PostList />;
}