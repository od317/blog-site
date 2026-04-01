"use client";

import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { usePostStore } from "@/lib/store/postStore";

export function PostList() {
  const { posts, isLoading, error, fetchPosts } = usePostStore();

  useEffect(() => {
    fetchPosts();
  }, []);

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
        <Card key={post.id} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="mt-2 text-gray-700">{post.content}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>By {post.username}</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <span>{post.like_count} likes</span>
                <span>{post.comment_count} comments</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
