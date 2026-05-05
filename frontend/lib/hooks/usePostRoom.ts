// lib/hooks/usePostRoom.ts
import { useEffect, useRef } from "react";
import { getSocket, initSocket, connectSocket } from "@/lib/socket/client";

export function usePostRoom(postId: string) {
  const hasJoinedRef = useRef(false);
  const socketReadyRef = useRef(false);

  useEffect(() => {
    const isMounted = true;

    const joinRoom = async () => {
      try {
        // Get or create socket connection
        let socket = getSocket();

        if (!socket || !socket.connected) {
          console.log("🔌 Socket not connected, connecting...");
          socket = await connectSocket();

          // Wait a small delay to ensure connection is fully established
          await new Promise((resolve) => {
            if (socket?.connected) {
              resolve(true);
            } else {
              const timeout = setTimeout(() => resolve(false), 5000);
              socket?.once("connect", () => {
                clearTimeout(timeout);
                resolve(true);
              });
            }
          });
        }

        if (!isMounted) return;

        // Ensure socket is connected and authenticated
        if (socket?.connected && !hasJoinedRef.current) {
          console.log("🚪 Joining post room:", postId);
          socket.emit("join-post", postId);
          hasJoinedRef.current = true;
          socketReadyRef.current = true;
        } else if (!socket?.connected) {
          console.error("❌ Socket failed to connect");
        }
      } catch (error) {
        console.error("❌ Error joining post room:", error);
      }
    };

    joinRoom();

    return () => {
      if (hasJoinedRef.current && socketReadyRef.current) {
        const socket = getSocket();
        if (socket?.connected) {
          console.log("🚪 Leaving post room:", postId);
          socket.emit("leave-post", postId);
        }
        hasJoinedRef.current = false;
        socketReadyRef.current = false;
      }
    };
  }, [postId]);
}
