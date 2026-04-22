// hooks/usePostState.ts
"use client";

import { useState } from "react";
import { Post, Comment } from "../../types/Post";

export function usePostState(initialPost: Post) {
  const [post, setPost] = useState<Post>(initialPost);
  const [comments, setComments] = useState<Comment[]>(
    initialPost.comments || [],
  );

  const updatePost = (updates: Partial<Post>) => {
    setPost((prev) => ({ ...prev, ...updates }));
  };

  const addComment = (newComment: Comment) => {
    setComments((prev) => {
      // Check if this is replacing a temp comment
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

    // Update comment count
    const currentCount = getCommentCount(post);
    updatePost({ comment_count: currentCount + 1 });

    return newComment;
  };

  const updateComment = (updatedComment: Comment) => {
    setComments((prev) =>
      prev.map((c) => (c.id === updatedComment.id ? updatedComment : c)),
    );
  };

  const deleteComment = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    // Update comment count
    const currentCount = getCommentCount(post);
    updatePost({ comment_count: Math.max(0, currentCount - 1) });
  };

  const getCommentCount = (post: Post): number => {
    return typeof post.comment_count === "string"
      ? parseInt(post.comment_count, 10)
      : post.comment_count;
  };

  return {
    post,
    comments,
    updatePost,
    addComment,
    updateComment,
    deleteComment,
  };
}
