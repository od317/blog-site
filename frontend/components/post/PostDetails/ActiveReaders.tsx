// components/post/PostDetails/ActiveReaders.tsx
"use client";

import { Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActiveReadersProps {
  postId: string;
  readerCount: number;
}

export function ActiveReaders({ postId, readerCount }: ActiveReadersProps) {
  const shouldShow = readerCount > 1;
  const otherReaders = readerCount - 1;
  const message =
    otherReaders === 1
      ? "1 person is reading this"
      : `${otherReaders} people are reading this`;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="active-readers"
          initial={{
            opacity: 0,
            maxHeight: 0,
            paddingTop: 0,
            paddingBottom: 0,
          }}
          animate={{
            opacity: 1,
            maxHeight: 60,
            paddingTop: 12,
            paddingBottom: 12,
          }}
          exit={{ opacity: 0, maxHeight: 0, paddingTop: 0, paddingBottom: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex items-center gap-2 border-b border-primary-500/10 bg-primary-500/5 overflow-hidden"
        >
          <div className="flex items-center gap-2 w-full px-6">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Eye className="h-4 w-4 text-primary-400 flex-shrink-0" />
            </motion.div>
            <span className="text-sm text-muted-foreground">{message}</span>
            <span className="ml-auto flex items-center gap-1 flex-shrink-0">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
              <span className="text-xs text-primary-400">live</span>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
