"use client";

import { useEffect } from "react";
import { usePostStore } from "@/lib/store/postStore";
import { useSearchParams } from "next/navigation";
import { PostCard } from "./PostCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";

export function PostList() {
  const { posts, isLoading, error, fetchPosts, currentSort } = usePostStore();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get("sort") || "latest";

  useEffect(() => {
    // Only fetch if sort has changed
    if (sortParam !== currentSort) {
      fetchPosts(sortParam);
    } else if (posts.length === 0) {
      // Initial load
      fetchPosts(sortParam);
    }
  }, [fetchPosts, sortParam, currentSort, posts.length]);

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Card className="p-4 text-center text-red-600">Error: {error}</Card>;
  }

  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-500">
        No posts yet. Be the first to create one!
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
