// components/post/PostDetails/ActiveReaders.tsx
"use client";

import { useState, useEffect } from "react";
import { getSocket, onReadersCountUpdated } from "@/lib/socket/client";
import { Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActiveReadersProps {
  postId: string;
}

export function ActiveReaders({ postId }: ActiveReadersProps) {
  const [readerCount, setReaderCount] = useState<number>(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (socket.connected) {
      socket.emit("join-post", postId);
    } else {
      socket.once("connect", () => {
        socket.emit("join-post", postId);
      });
    }

    const unsubscribe = onReadersCountUpdated(
      ({ postId: updatedPostId, count }) => {
        if (updatedPostId === postId) {
          setReaderCount(count);
        }
      },
    );

    return () => {
      if (unsubscribe) unsubscribe();
      if (socket && socket.connected) {
        socket.emit("leave-post", postId);
      }
    };
  }, [postId]);

  if (readerCount <= 1) {
    return null;
  }

  const otherReaders = readerCount - 1;
  const message =
    otherReaders === 1
      ? "1 person is reading this"
      : `${otherReaders} people are reading this`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 border-b border-primary-500/10 px-6 py-3 text-sm bg-primary-500/5"
      >
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Eye className="h-4 w-4 text-primary-400" />
        </motion.div>
        <span className="text-muted-foreground">{message}</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
          <span className="text-xs text-primary-400">live</span>
        </span>
      </motion.div>
    </AnimatePresence>
  );
}