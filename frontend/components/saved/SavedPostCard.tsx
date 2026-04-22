// components/saved/SavedPostCard.tsx
"use client";

import Link from "next/link";
import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { LikeButton } from "@/components/post/LikeButton";
import { SaveButton } from "@/components/post/PostDetails/SaveButton";
import { OptimizedAvatar } from "@/components/ui/OptimizedAvatar";
import type { Post } from "@/types/Post";
import { formatRelativeTime } from "@/lib/utils/dateFormatter";
import { OptimizedImage } from "../ui/OptimizedImage";

interface SavedPostCardProps {
  post: Post;
  onUnsaved?: (postId: string) => void;
}

export const SavedPostCard = memo(function SavedPostCard({
  post,
  onUnsaved,
}: SavedPostCardProps) {
  return (
    <Card className="overflow-hidden p-0 transition-shadow hover:shadow-md">
      {/* Featured Image */}
      {post.image_url && (
        <Link href={`/posts/${post.id}`} className="block">
          <div className="relative h-48 w-full overflow-hidden bg-gray-100">
            <OptimizedImage
              src={post.image_url}
              alt={post.title}
              aspectRatio="video"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
        </Link>
      )}

      <div className="p-6">
        {/* Author info */}
        <div className="mb-3 flex items-center gap-3">
          <OptimizedAvatar
            src={post.avatar_url}
            alt={post.username}
            size="sm"
          />

          <div className="flex-1">
            <Link
              href={`/${post.username}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {post.username}
            </Link>
          </div>
        </div>

        {/* Title */}
        <Link href={`/posts/${post.id}`}>
          <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}

        {/* Read more */}
        <Link
          href={`/posts/${post.id}`}
          className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Read more →
        </Link>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
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

          <SaveButton postId={post.id} />
        </div>
      </div>
    </Card>
  );
});
