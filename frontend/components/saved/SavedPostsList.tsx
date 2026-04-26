// components/saved/SavedPostsList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Post } from "@/types/Post";
import { Card } from "@/components/ui/Card";
import { LikeButton } from "@/components/post/LikeButton";
import { SaveButton } from "../post/PostDetails/SaveButton";
import { MessageCircle, ArrowRight } from "lucide-react";

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
              <div className="relative h-48 w-full overflow-hidden bg-muted cursor-pointer">
                <Image
                  src={post.image_url}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-primary-500/10 pointer-events-none" />
              </div>
            </Link>
          )}

          <div className="p-6">
            {/* Author info */}
            <div className="mb-3 flex items-center gap-2">
              {post.avatar_url ? (
                <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-primary-500/20">
                  <Image
                    src={post.avatar_url}
                    alt={post.username}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-medium text-white ring-1 ring-primary-500/20">
                  {post.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <Link
                  href={`/profile/${post.username}`}
                  className="font-semibold text-foreground hover:text-primary-400 transition-colors"
                >
                  {post.username}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Saved {formatDate(post.created_at)}
                </p>
              </div>
            </div>

            {/* Title */}
            <Link href={`/posts/${post.id}`}>
              <h2 className="text-xl font-semibold text-foreground hover:text-primary-400 transition-colors line-clamp-2">
                {post.title}
              </h2>
            </Link>

            {/* Excerpt */}
            <p className="mt-2 text-muted-foreground line-clamp-3">
              {post.content.substring(0, 200)}...
            </p>

            {/* Read more */}
            <Link
              href={`/posts/${post.id}`}
              className="inline-flex items-center gap-1 mt-3 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors group"
            >
              Read more
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-4 pt-3 border-t border-primary-500/10">
              <LikeButton
                postId={post.id}
                initialLikeCount={post.like_count}
                initialHasLiked={post.user_has_liked}
              />
              <Link href={`/posts/${post.id}#comments`}>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary-400 transition-colors">
                  <MessageCircle className="h-5 w-5" />
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