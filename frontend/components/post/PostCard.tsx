// components/post/PostCard.tsx
"use client";

import Link from "next/link";
import { memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { LikeButton } from "@/components/post/LikeButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { OptimizedAvatar } from "@/components/ui/OptimizedAvatar";
import { OptimizedFeaturedImage } from "@/components/ui/OptimizedFeaturedImage";
import { MessageCircle, ArrowRight } from "lucide-react";

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
      <article className="group rounded-xl border border-primary-500/10 bg-card hover:border-primary-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all duration-300 overflow-hidden">
        {/* Featured Image - Clickable */}
        {post.image_url && (
          <Link href={`/posts/${post.id}`}>
            <OptimizedFeaturedImage
              src={post.image_url}
              alt={post.title}
              aspectRatio="video"
            />
          </Link>
        )}

        <div className="p-6">
          {/* Author info */}
          {post.username && (
            <div className="flex items-center gap-3 mb-3 w-fit">
              <Link href={`/${post.username}`} className="group/author flex items-center gap-3 flex-1 min-w-0">
                <OptimizedAvatar
                  src={post.avatar_url}
                  alt={post.username}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground group-hover/author:text-primary-400 transition-colors truncate">
                      {post.username}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Title - Clickable */}
          <Link href={`/posts/${post.id}`}>
            <h2 className="text-xl font-semibold text-foreground group-hover:text-primary-400 transition-colors line-clamp-2">
              {post.title}
            </h2>
          </Link>

          {/* Meta info */}
          {post.readingTime && (
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span>{post.readingTime}</span>
            </div>
          )}

          {/* Excerpt - Clickable */}
          <Link href={`/posts/${post.id}`}>
            <p className="mt-3 text-muted-foreground line-clamp-3">
              {displayExcerpt}
            </p>

            {/* Read more */}
            <span className="inline-flex items-center gap-1 mt-3 text-sm text-primary-400 group-hover:text-accent-400 font-medium transition-colors">
              Read more
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          {/* Stats - NOT inside a Link, so clicks work independently */}
          <div className="mt-4 flex items-center gap-4 pt-3 border-t border-primary-500/10">
            <LikeButton
              postId={post.id}
              initialLikeCount={post.like_count}
              initialHasLiked={post.user_has_liked}
            />

            <Link
              href={`/posts/${post.id}#comments`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary-400 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{post.comment_count}</span>
            </Link>
          </div>

          {/* Error state */}
          {post.error && (
            <div className="mt-3 text-sm text-accent-400 bg-accent-500/10 border border-accent-500/20 p-2 rounded-lg">
              Failed to post: {post.error}
            </div>
          )}

          {/* Pending state */}
          {post.isPending && (
            <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Posting...
            </div>
          )}
        </div>
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