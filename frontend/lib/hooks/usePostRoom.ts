import { useEffect } from "react";
import { getSocket } from "../socket";

// lib/hooks/usePostRoom.ts
export function usePostRoom(postId: string) {
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    let timeoutId: NodeJS.Timeout;

    const attemptJoinRoom = async () => {
      const socket = getSocket();

      if (!socket?.connected) {
        console.log(`Socket not connected, retry ${retryCount}/${maxRetries}`);
        if (retryCount < maxRetries) {
          retryCount++;
          timeoutId = setTimeout(attemptJoinRoom, 2000); // Retry every 2 seconds
        }
        return;
      }

      // Socket is connected, try joining
      socket.emit("join-post", postId);

      // Wait for confirmation
      const joined = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);
        socket.once("post-joined", () => {
          clearTimeout(timeout);
          resolve(true);
        });
        socket.once("error", () => {
          clearTimeout(timeout);
          resolve(false);
        });
      });

      if (!joined && retryCount < maxRetries) {
        retryCount++;
        timeoutId = setTimeout(attemptJoinRoom, 2000);
      }
    };

    // Wait 3 seconds before first attempt (allow for cold start)
    timeoutId = setTimeout(attemptJoinRoom, 3000);

    return () => {
      clearTimeout(timeoutId);
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("leave-post", postId);
      }
    };
  }, [postId]);
}
