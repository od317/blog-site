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
  const hydrated = useRef(false);

  // Sync SSR posts to store on mount ONLY (initial page load)
  useEffect(() => {
    if (!hydrated.current) {
      console.log(`📡 Hydrating store with ${initialPosts.length} SSR posts`);
      usePostStore.setState({
        posts: initialPosts,
        isLoading: false,
        hasMore: initialPosts.length === 10,
        currentOffset: initialPosts.length,
        currentSort: initialSort,
      });
      hydrated.current = true;
    }
  }, []); // Empty deps - run once on mount

  return <PostList initialPosts={initialPosts} />;
}
