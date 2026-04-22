// lib/hooks/usePostFromStore.ts
"use client";

import { usePostStore } from "@/lib/store/postStore";
import { useShallow } from "zustand/react/shallow";
import type { Post } from "@/types/Post";

export function usePostFromStore(postId: string, fallback?: Post) {
  // Use useShallow to prevent unnecessary re-renders
  return usePostStore(
    useShallow((state) => {
      const post = state.posts.find((p) => p.id === postId);
      return post || fallback || null;
    }),
  );
}
