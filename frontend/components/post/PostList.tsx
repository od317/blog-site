"use client";

import { useEffect } from "react";
import { usePostStore } from "@/lib/store/postStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { PostItem } from "./PostItem";

export function PostList() {
  const { posts, isLoading, error, fetchPosts } = usePostStore();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
}
