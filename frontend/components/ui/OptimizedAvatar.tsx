// components/ui/OptimizedAvatar.tsx
"use client";

import Image from "next/image";
import { memo, useState } from "react";

interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { container: "h-8 w-8", imageSize: "32px" },
  md: { container: "h-10 w-10", imageSize: "40px" },
  lg: { container: "h-12 w-12", imageSize: "48px" },
};

export const OptimizedAvatar = memo(function OptimizedAvatar({
  src,
  alt,
  size = "md",
}: OptimizedAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { container, imageSize } = sizeMap[size];

  if (!src || hasError) {
    return (
      <div
        className={`${container} flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-medium`}
      >
        {alt?.[0]?.toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={`${container} relative flex-shrink-0 overflow-hidden rounded-full bg-gray-100`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={imageSize}
        className={`
          object-cover transition-opacity duration-300
          ${isLoaded ? "opacity-100" : "opacity-0"}
        `}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
        quality={90}
      />
    </div>
  );
});
