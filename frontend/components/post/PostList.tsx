"use client";

import { useEffect } from "react";
import { usePostStore } from "@/lib/store/postStore";
import { LikeButton } from "@/components/post/LikeButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

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
        <Card key={post.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                  {post.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <span className="font-semibold">{post.username}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="mt-2 text-gray-700">{post.content}</p>
              <Link href={`/posts/${post.id}`}>read more</Link>

              <div className="mt-4 flex items-center gap-4">
                <LikeButton
                  postId={post.id}
                  initialLikeCount={post.like_count}
                  initialHasLiked={post.user_has_liked}
                />
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500">
                  <span>💬</span>
                  <span className="text-sm">{post.comment_count}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Show error state for failed posts */}
          {post.error && (
            <div className="mt-3 text-sm text-red-600">
              Failed to post: {post.error}
              <button
                onClick={() => {
                  /* Implement retry */
                }}
                className="ml-2 text-blue-500 hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Show pending indicator */}
          {post.isPending && (
            <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Posting...
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
