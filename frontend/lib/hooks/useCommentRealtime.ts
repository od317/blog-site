"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket/client";
import type { Comment } from "@/types/Post";

interface UseCommentRealtimeProps {
  postId: string;
  onCommentAdded: (comment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
  onCommentUpdated: (comment: Comment) => void;
  currentUserId?: string;
}

export function useCommentRealtime({
  postId,
  onCommentAdded,
  onCommentDeleted,
  onCommentUpdated,
  currentUserId,
}: UseCommentRealtimeProps) {
  // Track temp comments to real IDs
  const tempToRealIdMap = useRef<Map<string, string>>(new Map());

  // Join post room for real-time comments
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("join-post", postId);

    return () => {
      socket.emit("leave-post", postId);
    };
  }, [postId]);

  // Listen for real-time comment events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewComment = (data: { comment: Comment; postId: string }) => {
      if (data.postId === postId) {
        // Skip if this is the current user's own comment (already added via optimistic update)
        if (currentUserId === data.comment.user_id) {
          return;
        }
        onCommentAdded(data.comment);
      }
    };

    const handleCommentDeleted = (data: {
      commentId: string;
      postId: string;
    }) => {
      if (data.postId === postId) {
        onCommentDeleted(data.commentId);
      }
    };

    const handleCommentUpdated = (data: {
      comment: Comment;
      postId: string;
    }) => {
      if (data.postId === postId) {
        onCommentUpdated(data.comment);
      }
    };

    socket.on("new-comment", handleNewComment);
    socket.on("comment-deleted", handleCommentDeleted);
    socket.on("comment-updated", handleCommentUpdated);

    return () => {
      socket.off("new-comment", handleNewComment);
      socket.off("comment-deleted", handleCommentDeleted);
      socket.off("comment-updated", handleCommentUpdated);
    };
  }, [
    postId,
    onCommentAdded,
    onCommentDeleted,
    onCommentUpdated,
    currentUserId,
  ]);

  return { tempToRealIdMap };
}
