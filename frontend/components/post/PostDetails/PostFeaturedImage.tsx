// components/post/PostDetails/PostFeaturedImage.tsx
"use client";

import Image from "next/image";
import { memo, useState } from "react";
import { motion } from "framer-motion";

interface PostFeaturedImageProps {
  imageUrl: string;
  title: string;
}

export const PostFeaturedImage = memo(function PostFeaturedImage({
  imageUrl,
  title,
}: PostFeaturedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative h-96 w-full overflow-hidden bg-muted">
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-primary-500/5 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/10 to-transparent animate-shimmer" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative h-full w-full"
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          className={`
            object-cover transition-all duration-700
            ${isLoading ? "scale-110 blur-xl" : "scale-100 blur-0"}
          `}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1000px"
          priority
          onLoad={() => setIsLoading(false)}
        />
      </motion.div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      {/* Image border glow */}
      <div className="absolute inset-0 ring-1 ring-inset ring-primary-500/10 pointer-events-none" />
    </div>
  );
});