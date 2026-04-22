// components/profile/ProfileAvatar.tsx
"use client";

import { memo, useRef, useState, useEffect } from "react";
import Image from "next/image";

interface ProfileAvatarProps {
  username: string;
  avatarUrl: string | null;
  isOwnProfile: boolean;
  onAvatarUpload: (file: File) => Promise<void>;
  onAvatarDelete: () => Promise<void>;
  isUploading: boolean;
}

export const ProfileAvatar = memo(function ProfileAvatar({
  username,
  avatarUrl,
  isOwnProfile,
  onAvatarUpload,
  onAvatarDelete,
  isUploading,
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayUrl = previewUrl || avatarUrl;

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    // Show preview
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);

    try {
      await onAvatarUpload(file);
    } finally {
      setPreviewUrl(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your profile picture?")) {
      return;
    }

    await onAvatarDelete();
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative h-32 w-32 overflow-hidden rounded-full ${
          isOwnProfile ? "cursor-pointer" : ""
        }`}
        onClick={() => isOwnProfile && fileInputRef.current?.click()}
      >
        {displayUrl ? (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gray-200" />
            )}
            <Image
              src={displayUrl}
              alt={username}
              fill
              sizes="128px"
              className={`
                object-cover transition-all duration-300
                ${isLoaded ? "opacity-100" : "opacity-0"}
                ${isHovered && isOwnProfile ? "brightness-75" : ""}
              `}
              onLoad={() => setIsLoaded(true)}
              priority
              quality={90}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white">
            {username[0]?.toUpperCase()}
          </div>
        )}

        {/* Hover overlay for own profile */}
        {isOwnProfile && isHovered && !isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}

        {/* Uploading indicator */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      {isOwnProfile && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      {/* Delete button */}
      {isOwnProfile && displayUrl && !isUploading && isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg hover:bg-red-600 transition-colors"
          title="Delete avatar"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
});
