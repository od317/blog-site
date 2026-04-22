// components/ui/OptimizedImage.tsx
"use client";

import Image from "next/image";
import { memo, useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  aspectRatio?: "video" | "square" | "portrait" | "wide";
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

const aspectRatioClasses = {
  video: "aspect-video", // 16:9
  square: "aspect-square", // 1:1
  portrait: "aspect-[3/4]", // 3:4
  wide: "aspect-[21/9]", // 21:9
};

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  aspectRatio = "video",
  className = "",
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 85,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`${aspectRatioClasses[aspectRatio]} bg-gray-200 flex items-center justify-center ${className}`}
      >
        <svg
          className="h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-gray-100 ${aspectRatioClasses[aspectRatio]} ${className}`}
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
        sizes={sizes}
        priority={priority}
        quality={quality}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`
          object-cover transition-all duration-700
          ${isLoaded ? "scale-100 blur-0" : "scale-110 blur-2xl"}
        `}
      />
    </div>
  );
});
