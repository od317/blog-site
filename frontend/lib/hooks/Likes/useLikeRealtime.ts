"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket/client";

interface UseLikeRealtimeProps {
  postId: string;
  onLikeUpdated: (postId: string, likeCount: number, action: string) => void;
  currentUserId?: string;
}

export function useLikeRealtime({
  postId,
  onLikeUpdated,
  currentUserId,
}: UseLikeRealtimeProps) {
  // Use refs to store callbacks so they don't cause re-renders
  const onLikeUpdatedRef = useRef(onLikeUpdated);
  const currentUserIdRef = useRef(currentUserId);

  // Update refs when callbacks change
  useEffect(() => {
    onLikeUpdatedRef.current = onLikeUpdated;
    currentUserIdRef.current = currentUserId;
  });

  // Join post room - runs only when postId changes
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("join-post", postId);

    return () => {
      socket.emit("leave-post", postId);
    };
  }, [postId]);

  // Listen for real-time like events - runs only once
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
        console.log(currentUserIdRef.current, data.userId);
        // Skip if this is the current user's own like (already updated optimistically)
        if (currentUserIdRef.current === data.userId) {
          console.log("❤️ Skipping own like update");
          return;
        }
        console.log("❤️ Real-time: Like update received", data);
        onLikeUpdatedRef.current(data.postId, data.likeCount, data.action);
      }
    };

    socket.on("like-updated", handleLikeUpdated);

    return () => {
      socket.off("like-updated", handleLikeUpdated);
    };
  }, [postId]);
}
