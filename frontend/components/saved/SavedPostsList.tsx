"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Post } from "@/types/Post";
import { Card } from "@/components/ui/Card";
import { LikeButton } from "@/components/post/LikeButton";
import { SaveButton } from "../post/PostDetails/SaveButton";

interface SavedPostsListProps {
  initialPosts: Post[];
  initialPagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function SavedPostsList({
  initialPosts,
  initialPagination,
}: SavedPostsListProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [pagination, setPagination] = useState(initialPagination);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden p-0">
          {/* Featured Image */}
          {post.image_url && (
            <Link href={`/posts/${post.id}`}>
              <div className="relative h-48 w-full overflow-hidden bg-gray-100 cursor-pointer">
                <Image
                  src={post.image_url}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            </Link>
          )}

          <div className="p-6">
            {/* Author info */}
            <div className="mb-3 flex items-center gap-2">
              {post.avatar_url ? (
                <div className="relative h-8 w-8 overflow-hidden rounded-full">
                  <Image
                    src={post.avatar_url}
                    alt={post.username}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-medium text-white">
                  {post.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <Link
                  href={`/profile/${post.username}`}
                  className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {post.username}
                </Link>
                <p className="text-xs text-gray-500">
                  Saved {formatDate(post.created_at)}
                </p>
              </div>
            </div>

            {/* Title */}
            <Link href={`/posts/${post.id}`}>
              <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                {post.title}
              </h2>
            </Link>

            {/* Excerpt */}
            <p className="mt-2 text-gray-600 line-clamp-3">
              {post.content.substring(0, 200)}...
            </p>

            {/* Read more */}
            <Link
              href={`/posts/${post.id}`}
              className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Read more →
            </Link>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-4 pt-3 border-t border-gray-100">
              <LikeButton
                postId={post.id}
                initialLikeCount={post.like_count}
                initialHasLiked={post.user_has_liked}
              />
              <Link href={`/posts/${post.id}#comments`}>
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                  <span>💬</span>
                  <span className="text-sm">{post.comment_count}</span>
                </button>
              </Link>
              <SaveButton postId={post.id} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
