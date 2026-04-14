"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getSocket } from "@/lib/socket/client";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import {
  addComment,
  deleteComment,
  updateComment,
} from "@/app/actions/comment.actions";
import type { Comment } from "@/types/Post";
import { useCommentRealtime } from "@/lib/hooks/useCommentRealtime";

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
  onCommentUpdated: (comment: Comment) => void;
}

const generateTempId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export function CommentSection({
  postId,
  comments,
  onCommentAdded,
  onCommentDeleted,
  onCommentUpdated,
}: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Wrap callbacks to stabilize them
  const handleCommentAdded = useCallback(
    (comment: Comment) => {
      onCommentAdded(comment);
    },
    [onCommentAdded],
  );

  const handleCommentDeleted = useCallback(
    (commentId: string) => {
      onCommentDeleted(commentId);
    },
    [onCommentDeleted],
  );

  const handleCommentUpdated = useCallback(
    (comment: Comment) => {
      console.log("📢 handleCommentUpdated called with:", comment);
      onCommentUpdated(comment);
    },
    [onCommentUpdated],
  );

  // Set up real-time listeners with stable callbacks
  useCommentRealtime({
    postId,
    onCommentAdded: handleCommentAdded,
    onCommentDeleted: handleCommentDeleted,
    onCommentUpdated: handleCommentUpdated,
    currentUserId: user?.id,
  });

  // ========== OPTIMISTIC ADD COMMENT (Recommended) ==========
  const handleAddComment = async (content: string) => {
    if (!isAuthenticated) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const tempId = generateTempId();

    // Create optimistic comment
    const optimisticComment: Comment = {
      id: tempId,
      content,
      post_id: postId,
      user_id: user?.id || "",
      username: user?.username || "You",
      full_name: user?.full_name || null,
      avatar_url: user?.avatar_url || null,
      created_at: new Date().toISOString(),
    };

    // Add optimistic comment immediately
    onCommentAdded(optimisticComment);
    setIsSubmitting(true);

    try {
      const result = await addComment({
        postId,
        content,
      });

      if (result.success && result.comment?.comment) {
        // Extract the real comment from the nested response
        const realComment = result.comment.comment;

        // Store mapping from temp ID to real ID
        tempToRealIdMap.current.set(tempId, realComment.id);

        // ✅ RECOMMENDED: Remove temp, add real
        onCommentDeleted(tempId);
        onCommentAdded(realComment);

        // Emit to other users
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("new-comment", {
            postId,
            comment: realComment,
          });
        }
      } else {
        // Failed - remove optimistic comment
        onCommentDeleted(tempId);
        console.error("Failed to add comment:", result.error);
      }
    } catch (error) {
      // Failed - remove optimistic comment
      onCommentDeleted(tempId);
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== OPTIMISTIC DELETE COMMENT ==========
  const handleDeleteComment = async (commentId: string) => {
    const commentToDelete = comments.find((c) => c.id === commentId);
    if (!commentToDelete) return;

    // Optimistic delete
    onCommentDeleted(commentId);
    setIsUpdating(true);

    try {
      const result = await deleteComment(commentId, postId);

      if (!result.success) {
        // Restore comment on failure
        onCommentAdded(commentToDelete);
        console.error("Failed to delete comment:", result.error);
      } else {
        // Emit to other users
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("delete-comment", {
            commentId,
            postId,
          });
        }
      }
    } catch (error) {
      // Restore comment on error
      onCommentAdded(commentToDelete);
      console.error("Failed to delete comment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // ========== OPTIMISTIC UPDATE COMMENT ==========
  const handleUpdateComment = async (commentId: string, newContent: string) => {
    const originalComment = comments.find((c) => c.id === commentId);
    if (!originalComment) return;

    const updatedComment = { ...originalComment, content: newContent };

    // Optimistic update
    onCommentUpdated(updatedComment);
    setIsUpdating(true);

    try {
      const result = await updateComment({
        commentId,
        postId,
        content: newContent,
      });

      if (result.success && result.comment) {
        // Update with server response
        onCommentUpdated(result.comment);

        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("update-comment", {
            commentId,
            postId,
            comment: result.comment,
          });
        }
      } else {
        // Revert on failure
        onCommentUpdated(originalComment);
        console.error("Failed to update comment:", result.error);
      }
    } catch (error) {
      // Revert on error
      onCommentUpdated(originalComment);
      console.error("Failed to update comment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">
        Comments ({comments.length})
      </h3>

      <CommentForm
        postId={postId}
        isSubmitting={isSubmitting}
        onSubmit={handleAddComment}
      />

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isUpdating={isUpdating}
              onDelete={handleDeleteComment}
              onUpdate={handleUpdateComment}
            />
          ))
        )}
      </div>
    </div>
  );
}
