"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useNotification } from "@/lib/hooks/useNotification";
import { usePostStore } from "@/lib/store/postStore";
import { Post } from "@/types/Post";

interface PostItemProps {
  post: Post;
}

export function PostItem({ post }: PostItemProps) {
  const { retryPost, removePost } = usePostStore();
  const { showSuccess, showError } = useNotification();

  const handleRetry = async () => {
    try {
      await retryPost(post.id, { title: post.title, content: post.content });
      showSuccess("Post created successfully!");
    } catch (error) {
      showError("Failed to create post. Please try again.");
    }
  };

  const handleDismiss = () => {
    removePost(post.id);
  };

  return (
    <Card
      className={`p-4 ${post.isPending ? "opacity-70" : ""} ${post.error ? "border-red-300 bg-red-50" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{post.title}</h3>
            {post.isPending && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-600"></span>
                Saving...
              </span>
            )}
            {post.error && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                Failed
              </span>
            )}
          </div>
          <p className="mt-2 text-gray-700">{post.content}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>By {post.username}</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
            <span>{post.like_count} likes</span>
            <span>{post.comment_count} comments</span>
          </div>
          {post.error && (
            <div className="mt-3 flex items-center gap-2">
              <p className="text-sm text-red-600">{post.error}</p>
              <Button size="sm" onClick={handleRetry}>
                Retry
              </Button>
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
