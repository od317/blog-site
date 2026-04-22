// components/post/PostCard.tsx (simplified version)
"use client";

import Link from "next/link";
import { memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { LikeButton } from "@/components/post/LikeButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { OptimizedAvatar } from "@/components/ui/OptimizedAvatar";
import { OptimizedFeaturedImage } from "@/components/ui/OptimizedFeaturedImage";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    image_url?: string | null;
    like_count: number;
    comment_count: number;
    user_has_liked: boolean;
    readingTime?: string;
    created_at: string;
    username?: string;
    avatar_url?: string | null;
    error?: string;
    isPending?: boolean;
  };
}

export const PostCard = memo(
  function PostCard({ post }: PostCardProps) {
    const formattedDate = formatDistanceToNow(new Date(post.created_at), {
      addSuffix: true,
    });

    const displayExcerpt =
      post.excerpt || post.content.substring(0, 200) + "...";

    return (
      <article className="group rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden">
        <Link href={`/posts/${post.id}`} className="block">
          {/* Featured Image */}
          {post.image_url && (
            <OptimizedFeaturedImage
              src={post.image_url}
              alt={post.title}
              aspectRatio="video"
            />
          )}

          <div className="p-6">
            {/* Author info */}
            {post.username && (
              <div className="flex items-center gap-2 mb-3">
                <OptimizedAvatar
                  src={post.avatar_url}
                  alt={post.username}
                  size="sm"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate">
                      {post.username}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {post.title}
            </h2>

            {/* Meta info */}
            {post.readingTime && (
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                <span>{post.readingTime}</span>
              </div>
            )}

            {/* Excerpt */}
            <p className="mt-3 text-gray-600 line-clamp-3">{displayExcerpt}</p>

            {/* Read more */}
            <span className="inline-block mt-2 text-sm text-blue-600 group-hover:text-blue-700 font-medium">
              Read more →
            </span>

            {/* Stats */}
            <div className="mt-4 flex items-center gap-4 pt-3 border-t border-gray-100">
              <LikeButton
                postId={post.id}
                initialLikeCount={post.like_count}
                initialHasLiked={post.user_has_liked}
              />

              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = `/posts/${post.id}#comments`;
                }}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
              >
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
            </div>

            {/* Error & Pending states */}
            {post.error && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                Failed to post: {post.error}
              </div>
            )}

            {post.isPending && (
              <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Posting...
              </div>
            )}
          </div>
        </Link>
      </article>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.title === nextProps.post.title &&
      prevProps.post.like_count === nextProps.post.like_count &&
      prevProps.post.comment_count === nextProps.post.comment_count &&
      prevProps.post.user_has_liked === nextProps.post.user_has_liked
    );
  },
);
