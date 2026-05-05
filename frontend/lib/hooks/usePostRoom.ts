// lib/hooks/usePostRoom.ts
import { useEffect, useRef } from "react";
import { getSocket, initSocket, connectSocket } from "@/lib/socket/client";
import { useAuthStore } from "../store/authStore";

// lib/hooks/usePostRoom.ts
export function usePostRoom(postId: string) {
  const hasJoinedRef = useRef(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const isMounted = true;

    const joinRoom = async () => {
      // Wait for authentication first
      if (!isAuthenticated || !user) {
        console.log("Waiting for authentication before joining room...");
        return;
      }

      try {
        let socket = getSocket();

        if (!socket || !socket.connected) {
          console.log("Socket not ready, connecting...");
          socket = await connectSocket();

          // Wait for socket to be fully ready
          await new Promise<void>((resolve) => {
            const checkReady = () => {
              if (socket?.connected && socket?.id) {
                resolve();
              } else if (!isMounted) {
                resolve();
              } else {
                setTimeout(checkReady, 100);
              }
            };
            checkReady();
          });
        }

        if (!isMounted || !socket?.connected) return;

        // Small delay to ensure authentication is processed
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log("Joining post room:", postId);
        socket.emit("join-post", postId);
        hasJoinedRef.current = true;
      } catch (error) {
        console.error("Error joining post room:", error);
      }
    };

    joinRoom();

    return () => {
      if (hasJoinedRef.current) {
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("leave-post", postId);
        }
        hasJoinedRef.current = false;
      }
    };
  }, [postId, isAuthenticated, user]);
}
