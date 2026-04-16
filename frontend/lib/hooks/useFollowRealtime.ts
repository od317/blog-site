"use client";

import { useEffect, useRef } from "react";
import { getSocket, onFollowersUpdated } from "@/lib/socket/client";

interface UseFollowRealtimeProps {
  profileUserId: string;
  onFollowersCountUpdate: (newCount: number, isFollowing: boolean) => void;
  currentUserId?: string;
}

export function useFollowRealtime({
  profileUserId,
  onFollowersCountUpdate,
  currentUserId,
}: UseFollowRealtimeProps) {
  const onFollowersCountUpdateRef = useRef(onFollowersCountUpdate);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => {
    onFollowersCountUpdateRef.current = onFollowersCountUpdate;
    currentUserIdRef.current = currentUserId;
  });

  // Join profile room
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("join-profile", profileUserId);
    console.log(`📖 Joined profile room: ${profileUserId}`);

    return () => {
      socket.emit("leave-profile", profileUserId);
      console.log(`📖 Left profile room: ${profileUserId}`);
    };
  }, [profileUserId]);

  // Listen for followers updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleFollowersUpdated = (data: {
      userId: string;
      followersCount: number;
      isFollowing: boolean;
      followerId: string;
    }) => {
      if (data.userId === profileUserId) {
        console.log("🔄 Real-time: Followers updated", data);

        // Only update the button state if this is the current user's action
        const shouldUpdateButtonState =
          data.followerId === currentUserIdRef.current;
        if (currentUserIdRef.current !== data.followerId)
          onFollowersCountUpdateRef.current(
            data.followersCount,
            shouldUpdateButtonState ? data.isFollowing : false,
          );
      }
    };

    socket.on("followers-updated", handleFollowersUpdated);

    return () => {
      socket.off("followers-updated", handleFollowersUpdated);
    };
  }, [profileUserId]);
}
