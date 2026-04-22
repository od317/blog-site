// components/post/PostDetails/PostFeaturedImage.tsx
"use client";

import Image from "next/image";
import { memo, useState } from "react";

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
    <div className="relative mb-6 h-96 w-full overflow-hidden rounded-lg bg-gray-100">
      <Image
        src={imageUrl}
        alt={title}
        fill
        className={`
          object-cover duration-700 ease-in-out
          ${isLoading ? "scale-110 blur-lg" : "scale-100 blur-0"}
        `}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1000px"
        priority
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
});
