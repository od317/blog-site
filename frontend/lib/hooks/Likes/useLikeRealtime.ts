"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket/client";

interface UseLikeRealtimeProps {
  postId: string;
  onLikeUpdated: (
    postId: string,
    likeCount: number,
    action: string,
    shouldUpdateUserStatus: boolean,
  ) => void;
  currentUserId?: string;
}

export function useLikeRealtime({
  postId,
  onLikeUpdated,
  currentUserId,
}: UseLikeRealtimeProps) {
  const onLikeUpdatedRef = useRef(onLikeUpdated);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    onLikeUpdatedRef.current = onLikeUpdated;
    currentUserIdRef.current = currentUserId;
    console.log("📡 useLikeRealtime - currentUserId updated:", currentUserId);
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("join-post", postId);

    return () => {
      socket.emit("leave-post", postId);
    };
  }, [postId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleLikeUpdated = (data: {
      postId: string;
      likeCount: number;
      userId: string;
      action: string;
    }) => {
      if (data.postId === postId) {
        const isCurrentUser = currentUserIdRef.current === data.userId;

        console.log("📡 Like event received:", {
          eventUserId: data.userId,
          currentUserId: currentUserIdRef.current,
          isCurrentUser,
          action: data.action,
        });

        // For current user: update both likeCount AND hasLiked
        // For other users: update only likeCount
        onLikeUpdatedRef.current(
          data.postId,
          data.likeCount,
          data.action,
          isCurrentUser, // This tells the callback whether to update user status
        );
      }
    };

    socket.on("like-updated", handleLikeUpdated);

    return () => {
      socket.off("like-updated", handleLikeUpdated);
    };
  }, [postId]);
}
