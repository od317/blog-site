"use client";

import { useState, useEffect } from "react";
import { getSocket, onReadersCountUpdated } from "@/lib/socket/client";

interface ActiveReadersProps {
  postId: string;
}

export function ActiveReaders({ postId }: ActiveReadersProps) {
  const [readerCount, setReaderCount] = useState<number>(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join the post room when component mounts
    if (socket.connected) {
      socket.emit("join-post", postId);
    } else {
      socket.once("connect", () => {
        socket.emit("join-post", postId);
      });
    }

    // Listen for reader count updates
    const unsubscribe = onReadersCountUpdated(
      ({ postId: updatedPostId, count }) => {
        if (updatedPostId === postId) {
          setReaderCount(count);
        }
      },
    );

    // Leave the post room when component unmounts
    return () => {
      if (unsubscribe) unsubscribe();
      if (socket && socket.connected) {
        socket.emit("leave-post", postId);
      }
    };
  }, [postId]);

  // Don't show if no one else is reading (except current user)
  if (readerCount <= 1) {
    return null;
  }

  const otherReaders = readerCount - 1;
  const message =
    otherReaders === 1
      ? "1 person is reading this"
      : `${otherReaders} people are reading this`;

  return (
    <div className="mb-4 flex items-center gap-2 border-b pb-3 text-sm text-gray-500">
      <span>👁️</span>
      <span>{message}</span>
    </div>
  );
}
