// components/ui/OptimizedFeaturedImage.tsx
"use client";

import Image from "next/image";
import { memo, useState } from "react";

interface OptimizedFeaturedImageProps {
  src: string;
  alt: string;
  aspectRatio?: "video" | "square" | "wide";
}

const aspectRatioClasses = {
  video: "aspect-video", // 16:9
  square: "aspect-square", // 1:1
  wide: "aspect-[21/9]", // 21:9
};

export const OptimizedFeaturedImage = memo(function OptimizedFeaturedImage({
  src,
  alt,
  aspectRatio = "video",
}: OptimizedFeaturedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden bg-gray-100 ${aspectRatioClasses[aspectRatio]}`}
    >
      {/* Blur placeholder */}
      <div
        className={`
          absolute inset-0 bg-gray-200 transition-opacity duration-500
          ${isLoaded ? "opacity-0" : "opacity-100"}
        `}
      />

      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={`
          object-cover transition-all duration-700
          group-hover:scale-105
          ${isLoaded ? "scale-100 blur-0" : "scale-110 blur-2xl"}
        `}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        quality={85}
        priority={false}
      />
    </div>
  );
});
