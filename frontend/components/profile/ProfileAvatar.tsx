// components/profile/ProfileAvatar.tsx
"use client";

import { memo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";

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

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);

    try {
      await onAvatarUpload(file);
    } finally {
      setPreviewUrl(null);
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
        className={`relative h-32 w-32 overflow-hidden rounded-full ring-4 ring-primary-500/20 hover:ring-primary-400/40 transition-all ${
          isOwnProfile ? "cursor-pointer" : ""
        }`}
        onClick={() => isOwnProfile && fileInputRef.current?.click()}
      >
        {displayUrl ? (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 animate-pulse bg-primary-500/10" />
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
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-accent-500 text-4xl font-bold text-white">
            {username[0]?.toUpperCase()}
          </div>
        )}

        {/* Hover overlay for own profile */}
        {isOwnProfile && isHovered && !isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Camera className="h-8 w-8 text-white" />
          </div>
        )}

        {/* Uploading indicator */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
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
          className="absolute -right-2 -top-2 rounded-full bg-accent-500 p-1.5 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)] hover:bg-accent-400 transition-all"
          title="Delete avatar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});