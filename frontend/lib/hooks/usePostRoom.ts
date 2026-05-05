// lib/hooks/usePostRoom.ts
import { useEffect, useRef } from "react";
import { getSocket, connectSocket } from "@/lib/socket/client";
import { roomManager } from "@/lib/socket/roomManager";

export function usePostRoom(postId: string) {
  const hasJoinedRef = useRef(false);
  const roomName = `post-${postId}`;

  useEffect(() => {
    const isMounted = true;

    const joinRoom = async () => {
      try {
        let socket = getSocket();

        if (!socket || !socket.connected) {
          socket = await connectSocket();

          // Wait for connection
          await new Promise<void>((resolve) => {
            if (socket?.connected) {
              resolve();
            } else {
              const timeout = setTimeout(resolve, 10000);
              socket?.once("connect", () => {
                clearTimeout(timeout);
                resolve();
              });
            }
          });
        }

        if (!isMounted || !socket?.connected) return;

        // Add small delay for authentication on Render free tier
        await new Promise((resolve) => setTimeout(resolve, 1000));

        socket.emit("join-post", postId);
        hasJoinedRef.current = true;

        // 🔥 Register with room manager
        roomManager.addRoom(roomName, () => {
          // Cleanup function
          const s = getSocket();
          if (s?.connected) {
            s.emit("leave-post", postId);
          }
        });

        console.log(`✅ Joined room: ${roomName}`);

        // Listen for successful join
        socket.once("post-joined", (data) => {
          console.log(`✅ Confirmed joined room: ${roomName}`, data);
        });
      } catch (error) {
        console.error(`❌ Error joining room ${roomName}:`, error);

        // Retry after delay (for cold starts)
        if (isMounted) {
          setTimeout(() => {
            const socket = getSocket();
            if (socket?.connected && isMounted) {
              console.log(`🔄 Retrying join room: ${roomName}`);
              socket.emit("join-post", postId);
              hasJoinedRef.current = true;
              roomManager.addRoom(roomName);
            }
          }, 3000);
        }
      }
    };

    joinRoom();

    return () => {
      hasJoinedRef.current = false;
      roomManager.removeRoom(roomName);
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("leave-post", postId);
      }
    };
  }, [postId, roomName]);
}
