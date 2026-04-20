"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";

interface ProfileAvatarProps {
  username: string;
  avatarUrl: string | null;
  isOwnProfile: boolean;
  onAvatarUpload: (file: File) => Promise<void>;
  onAvatarDelete: () => Promise<void>;
  isUploading: boolean;
}

export function ProfileAvatar({
  username,
  avatarUrl,
  isOwnProfile,
  onAvatarUpload,
  onAvatarDelete,
  isUploading,
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displayUrl, setDisplayUrl] = useState<string | null>(avatarUrl);

  // ✅ Sync displayUrl with avatarUrl prop when it changes (e.g., after delete)
  useEffect(() => {
    // Only update if not showing a preview
    const setDisplay = () => {
      if (!previewUrl) {
        setDisplayUrl(avatarUrl);
      }
    };
    setDisplay();
  }, [avatarUrl, previewUrl]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    // Show preview immediately
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setDisplayUrl(newPreviewUrl);

    await onAvatarUpload(file);

    // Clear preview after upload - displayUrl will be updated by the useEffect
    setPreviewUrl(null);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your profile picture?"))
      return;

    // Optimistic update - clear the avatar immediately
    setDisplayUrl(null);
    setPreviewUrl(null);

    await onAvatarDelete();
  };

  const finalAvatarUrl = previewUrl || displayUrl || avatarUrl;

  return (
    <div className="relative">
      <div
        className={`relative h-32 w-32 overflow-hidden rounded-full ${
          isOwnProfile ? "cursor-pointer group" : ""
        }`}
        onClick={handleAvatarClick}
      >
        {finalAvatarUrl ? (
          <Image
            src={finalAvatarUrl}
            alt={username}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white">
            {username[0]?.toUpperCase()}
          </div>
        )}

        {/* Upload overlay */}
        {isOwnProfile && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
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

      {/* Delete avatar button */}
      {isOwnProfile && finalAvatarUrl && (
        <button
          onClick={handleDelete}
          disabled={isUploading}
          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 disabled:opacity-50"
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

      {/* Upload indicator */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
    </div>
  );
}
