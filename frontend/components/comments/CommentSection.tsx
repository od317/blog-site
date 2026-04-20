"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentUpdated?: (comment: Comment) => void;
}

const generateTempId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// ✅ Helper function to update a comment in the nested tree
const updateCommentInTree = (
  comments: Comment[],
  targetId: string,
  updatedContent: string,
): Comment[] => {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return { ...comment, content: updatedContent };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, targetId, updatedContent),
      };
    }
    return comment;
  });
};

export function CommentSection({ postId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const tempToRealIdMap = useRef<Map<string, string>>(new Map());

  // Fetch nested comments from API
  const fetchComments = useCallback(async () => {
    try {
      console.log("💬 Fetching nested comments for post:", postId);
      const response = await fetch(
        `/api/proxy/posts/${postId}/comments/nested`,
      );
      const data = await response.json();
      console.log("💬 Nested comments response:", data);

      if (data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("💬 Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time listeners for comments and replies
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.log("💬 No socket connection");
      return;
    }

    console.log("💬 Setting up real-time listeners for post:", postId);

    const handleNewComment = (data: { comment: Comment; postId: string }) => {
      console.log("💬 Received new-comment event:", data);
      if (data.postId === postId && data.comment.user_id !== user?.id) {
        fetchComments();
      }
    };

    const handleNewReply = (data: {
      comment: Comment;
      postId: string;
      parentId: string;
    }) => {
      console.log("💬 Received new-reply event:", data);
      if (data.postId === postId && data.comment.user_id !== user?.id) {
        fetchComments();
      }
    };

    const handleCommentDeleted = (data: {
      commentId: string;
      postId: string;
    }) => {
      console.log("💬 Received comment-deleted event:", data);
      if (data.postId === postId) {
        fetchComments();
      }
    };

    // ✅ FIX: Update comment in place instead of refetching
    const handleCommentUpdated = (data: {
      comment: Comment;
      postId: string;
    }) => {
      console.log("💬 Received comment-updated event:", data);
      if (data.postId === postId) {
        // Update the comment in the existing state
        setComments((prev) =>
          updateCommentInTree(prev, data.comment.id, data.comment.content),
        );
      }
    };

    socket.on("new-comment", handleNewComment);
    socket.on("new-reply", handleNewReply);
    socket.on("comment-deleted", handleCommentDeleted);
    socket.on("comment-updated", handleCommentUpdated);

    return () => {
      console.log("💬 Cleaning up real-time listeners");
      socket.off("new-comment", handleNewComment);
      socket.off("new-reply", handleNewReply);
      socket.off("comment-deleted", handleCommentDeleted);
      socket.off("comment-updated", handleCommentUpdated);
    };
  }, [postId, user?.id, fetchComments]);

  const handleAddComment = async (content: string) => {
    console.log("💬 Adding comment:", { postId, content });

    if (!isAuthenticated) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const tempId = generateTempId();
    const optimisticComment: Comment = {
      id: tempId,
      content,
      post_id: postId,
      user_id: user?.id || "",
      username: user?.username || "You",
      full_name: user?.full_name || null,
      avatar_url: user?.avatar_url || null,
      parent_id: null,
      reply_count: 0,
      created_at: new Date().toISOString(),
    };

    console.log("💬 Adding optimistic comment:", optimisticComment);
    setComments((prev) => [optimisticComment, ...prev]);
    setIsSubmitting(true);

    try {
      const result = await addComment({ postId, content });
      console.log("💬 addComment result:", result);

      if (result.success && result.comment) {
        const realComment = result.comment as Comment;
        tempToRealIdMap.current.set(tempId, realComment.id);
        await fetchComments();

        const socket = getSocket();
        if (socket?.connected) {
          console.log("💬 Emitting new-comment event");
          socket.emit("new-comment", { postId, comment: realComment });
        }
      } else {
        console.error("💬 Failed to add comment:", result.error);
        setComments((prev) => prev.filter((c) => c.id !== tempId));
      }
    } catch (error) {
      console.error("💬 Error adding comment:", error);
      setComments((prev) => prev.filter((c) => c.id !== tempId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    console.log("🗑️ Deleting comment:", commentId);
    setIsUpdating(true);

    try {
      const result = await deleteComment(commentId, postId);
      console.log("🗑️ deleteComment result:", result);

      if (result.success) {
        await fetchComments();
      }
    } catch (error) {
      console.error("🗑️ Error deleting comment:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ FIX: Update comment in place without refetch
  const handleUpdateComment = async (commentId: string, newContent: string) => {
    console.log("✏️ Updating comment:", { commentId, newContent });

    // Optimistic update - update UI immediately
    setComments((prev) => updateCommentInTree(prev, commentId, newContent));
    setIsUpdating(true);

    try {
      const result = await updateComment({
        commentId,
        postId,
        content: newContent,
      });
      console.log("✏️ updateComment result:", result);

      if (!result.success) {
        // Revert on error - refetch to get original content
        console.error("✏️ Failed to update comment:", result.error);
        await fetchComments();
      }
    } catch (error) {
      console.error("✏️ Error updating comment:", error);
      await fetchComments(); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReplyAdded = (reply: Comment) => {
    console.log("💬 Reply added:", reply);
    fetchComments();

    const socket = getSocket();
    if (socket?.connected) {
      console.log("💬 Emitting new-reply event");
      socket.emit("new-reply", {
        postId,
        comment: reply,
        parentId: reply.parent_id,
      });
    }
  };

  const totalComments = comments.reduce((acc, comment) => {
    return acc + 1 + (comment.replies?.length || 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Comments ({totalComments})</h3>

      <CommentForm
        postId={postId}
        isSubmitting={isSubmitting}
        onSubmit={handleAddComment}
      />

      <div className="mt-6 space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              isUpdating={isUpdating}
              onDelete={handleDeleteComment}
              onUpdate={handleUpdateComment}
              onReplyAdded={handleReplyAdded}
            />
          ))
        )}
      </div>
    </div>
  );
}
