// components/post/PostDetails/index.tsx
"use client";

import Link from "next/link";
import { Button } from "../../ui/Button";
import { ActiveReaders } from "./ActiveReaders";
import { CommentSection } from "../../comments/CommentSection";
import { PostHeader } from "./PostHeader";
import { PostFeaturedImage } from "./PostFeaturedImage";
import { PostContent } from "./PostContent";
import { PostActions } from "./PostActions";
import { usePostStore } from "../../../lib/store/postStore";
import { useCallback, memo } from "react";
import type { Post, Comment } from "../../../types/Post";
import { usePostState } from "../../../lib/hooks/usePostState";
import { usePostRoom } from "../../../lib/hooks/usePostRoom";

interface PostDetailsProps {
  post: Post;
}

export const PostDetails = memo(function PostDetails({
  post: initialPost,
}: PostDetailsProps) {
  // Custom hooks for state and real-time
  const { post, addComment, updateComment, deleteComment } =
    usePostState(initialPost);

  // Real-time room management
  usePostRoom(post.id);

  // Store actions
  const updateCommentCount = usePostStore((state) => state.updateCommentCount);

  // Memoized handlers to prevent unnecessary re-renders
  const handleCommentAdded = useCallback(
    (newComment: Comment) => {
      const comment = addComment(newComment);
      updateCommentCount(post.id, post.comment_count);
      return comment;
    },
    [addComment, updateCommentCount, post.id, post.comment_count],
  );

  const handleCommentUpdated = useCallback(
    (updatedComment: Comment) => {
      updateComment(updatedComment);
    },
    [updateComment],
  );

  const handleCommentDeleted = useCallback(
    (commentId: string) => {
      deleteComment(commentId);
      updateCommentCount(post.id, post.comment_count);
    },
    [deleteComment, updateCommentCount, post.id, post.comment_count],
  );

  return (
    <div>
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

      <CommentSection
        postId={post.id}
        onCommentAdded={handleCommentAdded}
        onCommentDeleted={handleCommentDeleted}
        onCommentUpdated={handleCommentUpdated}
      />
    </div>
  );
});

// Custom comparison for memo
export default PostDetails;
