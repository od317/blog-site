// hooks/usePostRoom.ts
"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket/client";

export function usePostRoom(postId: string) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join the post room when component mounts
    // This is needed for ActiveReaders to work
    if (socket.connected) {
      socket.emit("join-post", postId);
      console.log(`📖 Joined post room: ${postId}`);
    } else {
      socket.once("connect", () => {
        socket.emit("join-post", postId);
        console.log(`📖 Joined post room after connect: ${postId}`);
      });
    }

    // Leave the post room when component unmounts
    return () => {
      if (socket.connected) {
        socket.emit("leave-post", postId);
        console.log(`📖 Left post room: ${postId}`);
      }
    };
  }, [postId]);
}
