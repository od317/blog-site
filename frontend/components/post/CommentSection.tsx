"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { getSocket } from "@/lib/socket/client";
import type { Comment } from "@/types/Post";
import type {
  AddCommentResponse,
  DeleteCommentResponse,
} from "@/types/comment";
import { joinPostRoom, leavePostRoom } from "@/lib/socket";

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
}

export function CommentSection({
  postId,
  comments,
  onCommentAdded,
  onCommentDeleted,
}: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Join post room for real-time comments
  useEffect(() => {
    joinPostRoom(postId);
    return () => {
      leavePostRoom(postId);
    };
  }, [postId]);

  // Listen for real-time comment events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewComment = (data: {
      comment: Comment;
      postId: string;
      commentCount: number;
    }) => {
      if (data.postId === postId) {
        onCommentAdded(data.comment);
      }
    };

    const handleCommentDeleted = (data: {
      commentId: string;
      postId: string;
      commentCount: number;
    }) => {
      if (data.postId === postId) {
        onCommentDeleted(data.commentId);
      }
    };

    socket.on("new-comment", handleNewComment);
    socket.on("comment-deleted", handleCommentDeleted);

    return () => {
      socket.off("new-comment", handleNewComment);
      socket.off("comment-deleted", handleCommentDeleted);
    };
  }, [postId, onCommentAdded, onCommentDeleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post<AddCommentResponse>(
        `/posts/${postId}/comments`,
        {
          content: content.trim(),
        },
      );

      if (response.success) {
        setContent("");
        onCommentAdded(response.comment);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await api.delete<DeleteCommentResponse>(`/posts/comments/${commentId}`);
      onCommentDeleted(commentId);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">
        Comments ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          placeholder={
            isAuthenticated ? "Write a comment..." : "Please login to comment"
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!isAuthenticated || isSubmitting}
          className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          rows={3}
        />
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!content.trim() || !isAuthenticated}
        >
          Post Comment
        </Button>
      </form>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 border-b pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                {comment.username?.[0]?.toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{comment.username}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {isAuthenticated && user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
