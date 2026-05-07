// components/post/PostDetails/ActiveReaders.tsx
"use client";

import { Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActiveReadersProps {
  postId: string;
  readerCount: number; // ✅ Now received as prop
}

export function ActiveReaders({ postId, readerCount }: ActiveReadersProps) {
  console.log(`[ActiveReaders] post=${postId} readers=${readerCount}`);

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
