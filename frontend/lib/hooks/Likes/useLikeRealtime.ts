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
  const isRegisteredRef = useRef(false);

  // Update refs when callbacks change
  useEffect(() => {
    onLikeUpdatedRef.current = onLikeUpdated;
    currentUserIdRef.current = currentUserId;
    console.log("📡 useLikeRealtime - currentUserId updated:", currentUserId);
  });

  // Join post room
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.log("📡 No socket available, cannot join post room");
      return;
    }

    // Function to join room
    const joinRoom = () => {
      if (socket.connected) {
        console.log(`📡 Joining post room: ${postId}`);
        socket.emit("join-post", postId);
        isRegisteredRef.current = true;
      }
    };

    // Join now if connected, otherwise wait for connection
    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    return () => {
      if (socket && socket.connected && isRegisteredRef.current) {
        console.log(`📡 Leaving post room: ${postId}`);
        socket.emit("leave-post", postId);
        isRegisteredRef.current = false;
      }
    };
  }, [postId]);

  // Listen for like updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.log("📡 No socket available, cannot listen for like updates");
      return;
    }

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
          likeCount: data.likeCount,
        });

        onLikeUpdatedRef.current(
          data.postId,
          data.likeCount,
          data.action,
          isCurrentUser,
        );
      }
    };

    // Only register once
    if (!isRegisteredRef.current) {
      console.log(`📡 Registering like-updated listener for post ${postId}`);
      socket.on("like-updated", handleLikeUpdated);
      isRegisteredRef.current = true;
    }

    return () => {
      if (socket) {
        socket.off("like-updated", handleLikeUpdated);
        isRegisteredRef.current = false;
      }
    };
  }, [postId]);
}
