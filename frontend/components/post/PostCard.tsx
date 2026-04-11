// ============================================
// COMPONENT: Post Card
// RENDERING: Client Component
// CACHE: N/A - Pure presentational component
// ============================================

"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { LikeButton } from "@/components/post/LikeButton";
import { useAuth } from "@/lib/hooks/useAuth";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    excerpt: string;
    like_count: number;
    comment_count: number;
    user_has_liked: boolean;
    readingTime: string;
    created_at: string;
  };
  showAuthor?: boolean;
  authorName?: string;
}

export function PostCard({
  post,
  showAuthor = false,
  authorName,
}: PostCardProps) {
  const { isAuthenticated } = useAuth();

  const formattedDate = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  return (
    <article className="group rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/posts/${post.id}`} className="block">
        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h2>

        {/* Author (if needed) */}
        {showAuthor && authorName && (
          <p className="mt-1 text-sm text-gray-500">
            By <span className="font-medium">{authorName}</span>
          </p>
        )}

        {/* Meta info */}
        <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
          <span>{formattedDate}</span>
          <span>•</span>
          <span>{post.readingTime}</span>
        </div>

        {/* Excerpt */}
        <p className="mt-3 text-gray-600 line-clamp-3">{post.excerpt}</p>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4">
          <LikeButton
            postId={post.id}
            initialLikeCount={post.like_count}
            initialHasLiked={post.user_has_liked}
          />
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
        </div>
      </Link>
    </article>
  );
}
