"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePostStore } from "@/lib/store/postStore";
import { LikeButton } from "@/components/post/LikeButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";

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
        <Card key={post.id} className="overflow-hidden p-0">
          {/* Featured Image (if exists) */}
          {post.image_url && (
            <Link href={`/posts/${post.id}`}>
              <div className="relative h-64 w-full overflow-hidden bg-gray-100 cursor-pointer">
                <Image
                  src={post.image_url}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </Link>
          )}

          <div className="p-6">
            {/* Author info */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-medium">
                {post.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <span className="font-semibold text-gray-900">
                  {post.username}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Title */}
            <Link href={`/posts/${post.id}`}>
              <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                {post.title}
              </h3>
            </Link>

            {/* Content preview */}
            <p className="mt-2 text-gray-600 line-clamp-3">{post.content}</p>

            {/* Read more link */}
            <Link
              href={`/posts/${post.id}`}
              className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Read more →
            </Link>

            {/* Stats */}
            <div className="mt-4 flex items-center gap-4 pt-3 border-t border-gray-100">
              <LikeButton
                postId={post.id}
                initialLikeCount={post.like_count}
                initialHasLiked={post.user_has_liked}
              />
              <Link href={`/posts/${post.id}#comments`}>
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-sm">{post.comment_count}</span>
                </button>
              </Link>
            </div>

            {/* Show error state for failed posts */}
            {post.error && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
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
          </div>
        </Card>
      ))}
    </div>
  );
}
