// components/saved/SavedPostsList.tsx
"use client";

import { SavedPostCard } from "./SavedPostCard";
import { useRealtime } from "@/lib/hooks/useRealtime";
import type { Post, PaginationData } from "@/types/Post";

interface SavedPostsListProps {
  initialPosts: Post[];
  initialPagination: PaginationData;
}

export function SavedPostsList({ initialPosts }: SavedPostsListProps) {
  // Enable real-time updates for likes and comments
  useRealtime();

  return (
    <div className="space-y-4">
      {initialPosts.map((post) => (
        <SavedPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
