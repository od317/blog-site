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
  // Use refs to store callbacks so they don't cause re-renders
  const onCommentAddedRef = useRef(onCommentAdded);
  const onCommentDeletedRef = useRef(onCommentDeleted);
  const onCommentUpdatedRef = useRef(onCommentUpdated);
  const currentUserIdRef = useRef(currentUserId);

  // Update refs when callbacks change
  useEffect(() => {
    onCommentAddedRef.current = onCommentAdded;
    onCommentDeletedRef.current = onCommentDeleted;
    onCommentUpdatedRef.current = onCommentUpdated;
    currentUserIdRef.current = currentUserId;
  });

  // Track temp comments to real IDs
  const tempToRealIdMap = useRef<Map<string, string>>(new Map());

  // Join post room - runs only when postId changes
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("join-post", postId);

    return () => {
      socket.emit("leave-post", postId);
    };
  }, [postId]);

  // Listen for real-time comment events - runs only once
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewComment = (data: { comment: Comment; postId: string }) => {
      if (data.postId === postId) {
        if (currentUserIdRef.current === data.comment.user_id) {
          return;
        }
        onCommentAddedRef.current(data.comment);
      }
    };

    const handleCommentDeleted = (data: {
      commentId: string;
      postId: string;
    }) => {
      if (data.postId === postId) {
        onCommentDeletedRef.current(data.commentId);
      }
    };

    const handleCommentUpdated = (data: {
      comment: Comment;
      postId: string;
      commentCount: number;
    }) => {
      if (data.postId === postId) {
        console.log(
          "🔄 Real-time: Comment updated received in hook",
          data.comment,
        );
        onCommentUpdatedRef.current(data.comment);
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
  }, [postId]);

  return { tempToRealIdMap };
}
