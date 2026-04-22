// components/post/PostDetails/PostDetails.tsx
"use client";

import Link from "next/link";
import { memo, useCallback, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ActiveReaders } from "./ActiveReaders";
import { CommentSection } from "../../comments/CommentSection";
import { PostHeader } from "./PostHeader";
import { PostFeaturedImage } from "./PostFeaturedImage";
import { PostContent } from "./PostContent";
import { PostActions } from "./PostActions";
import { usePostRoom } from "@/lib/hooks/usePostRoom";
import { usePostFromStore } from "@/lib/hooks/usePostFromStore";
import { usePostStore } from "@/lib/store/postStore";
import type { Post, Comment } from "@/types/Post";

interface PostDetailsProps {
  post: Post;
}

export const PostDetails = memo(function PostDetails({
  post: initialPost,
}: PostDetailsProps) {
  // Use ref to track if we've already logged
  const hasLoggedRef = useRef(false);

  // Only log once per mount (StrictMode will still log twice in dev)
  useEffect(() => {
    if (!hasLoggedRef.current) {
      console.log("🎯 PostDetails mounted with post:", initialPost.id);
      hasLoggedRef.current = true;
    }
  }, [initialPost.id]);

  // Ensure post is in store (only runs once)
  const ensurePostInStore = usePostStore((state) => state.ensurePost);

  useEffect(() => {
    ensurePostInStore(initialPost);
  }, [initialPost, ensurePostInStore]);

  // Get post from store (optimized selector)
  const post = usePostFromStore(initialPost.id, initialPost);

  // Local state for comments
  const [comments, setComments] = useState<Comment[]>(
    initialPost.comments || [],
  );

  // Real-time room management
  usePostRoom(post!.id);

  // Store actions (selective subscription)
  const updateCommentCount = usePostStore((state) => state.updateCommentCount);

  // Only subscribe to this specific post's updates for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const unsubscribe = usePostStore.subscribe((state, prevState) => {
        const prevPost = prevState.posts.find((p) => p.id === initialPost.id);
        const currentPost = state.posts.find((p) => p.id === initialPost.id);

        // Only log if THIS post actually changed
        if (JSON.stringify(prevPost) !== JSON.stringify(currentPost)) {
          console.log("🔄 Post updated in store:", {
            id: currentPost?.id,
            title: currentPost?.title,
          });
        }
      });

      return unsubscribe;
    }
  }, [initialPost.id]);

  // Memoized handlers
  const handleCommentAdded = useCallback(
    (newComment: Comment) => {
      setComments((prev) => {
        const existingTempIndex = prev.findIndex(
          (c) => c.id?.startsWith("temp-") && c.content === newComment.content,
        );

        if (existingTempIndex !== -1) {
          const updated = [...prev];
          updated[existingTempIndex] = newComment;
          return updated;
        }
        return [newComment, ...prev];
      });

      const currentCount =
        typeof post!.comment_count === "string"
          ? parseInt(post!.comment_count, 10)
          : post!.comment_count;

      updateCommentCount(post!.id, currentCount + 1);

      return newComment;
    },
    [updateCommentCount, post!.id, post!.comment_count],
  );

  const handleCommentUpdated = useCallback((updatedComment: Comment) => {
    setComments((prev) =>
      prev.map((c) => (c.id === updatedComment.id ? updatedComment : c)),
    );
  }, []);

  const handleCommentDeleted = useCallback(
    (commentId: string) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));

      const currentCount =
        typeof post!.comment_count === "string"
          ? parseInt(post!.comment_count, 10)
          : post!.comment_count;

      updateCommentCount(post!.id, Math.max(0, currentCount - 1));
    },
    [updateCommentCount, post!.id, post!.comment_count],
  );

  // Don't render until post is available
  if (!post) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/">
        <Button variant="outline" className="mb-4">
          ← Back to Feed
        </Button>
      </Link>

      <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <ActiveReaders postId={post.id} />

        <PostHeader
          postId={post.id}
          authorId={post.user_id}
          username={post.username}
          avatarUrl={post.avatar_url}
          createdAt={post.created_at}
        />

        {post.image_url && (
          <PostFeaturedImage imageUrl={post.image_url} title={post.title} />
        )}

        <PostContent title={post.title} content={post.content} />

        <PostActions
          postId={post.id}
          likeCount={post.like_count}
          commentCount={post.comment_count}
        />
      </article>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Comments ({post.comment_count})
        </h2>
        <CommentSection
          postId={post.id}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
          onCommentUpdated={handleCommentUpdated}
        />
      </section>
    </div>
  );
});

export default PostDetails;
