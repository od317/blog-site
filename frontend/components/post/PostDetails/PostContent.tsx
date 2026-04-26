// components/post/PostDetails/PostContent.tsx
"use client";

import { memo } from "react";
import { motion } from "framer-motion";

interface PostContentProps {
  title: string;
  content: string;
}

export const PostContent = memo(function PostContent({
  title,
  content,
}: PostContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <h1 className="mb-6 text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
        {title}
      </h1>
      
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-[15px] space-y-4">
          {content.split('\n').map((paragraph, index) => (
            paragraph.trim() ? (
              <p key={index} className="min-h-[1.5em]">
                {paragraph}
              </p>
            ) : (
              <br key={index} />
            )
          ))}
        </div>
      </div>

      {/* Decorative divider */}
      <div className="mt-8 h-px bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
    </motion.div>
  );
});