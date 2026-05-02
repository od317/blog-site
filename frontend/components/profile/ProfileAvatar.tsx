"use client";

import { memo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Camera, X, Check } from "lucide-react";

interface ProfileAvatarProps {
  username: string;
  avatarUrl: string | null;
  isOwnProfile: boolean;
  onAvatarUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
  onAvatarDelete: () => Promise<void>;
  isUploading: boolean;
}

export const ProfileAvatar = memo(function ProfileAvatar({
  username,
  avatarUrl,
  isOwnProfile,
  onAvatarUpload,
  onAvatarDelete,
  isUploading: externalIsUploading,
}: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-clear success after 3 seconds
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => setIsSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

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

    setError(null);
    setIsSuccess(false);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, GIF, or WebP)");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size (max 2MB for avatar)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      setError(`Image is too large. Maximum size is 2MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setIsUploading(true);

    try {
      const result = await onAvatarUpload(file);
      if (result.success) {
        setIsSuccess(true);
      } else if (result.error) {
        setError(result.error);
        setPreviewUrl(null);
      }
    } catch {
      setError("Failed to upload image. Please try again.");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    setError(null);
    setIsSuccess(false);
    setIsUploading(true);
    
    await onAvatarDelete();
    
    setIsUploading(false);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
  };

  const showLoading = isUploading || externalIsUploading;

  return (
    <div className="relative">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`relative h-32 w-32 overflow-hidden rounded-full ring-4 ring-primary-500/20 transition-all ${
            isOwnProfile && !showLoading ? "hover:ring-primary-400/40 cursor-pointer" : ""
          }`}
          onClick={() => isOwnProfile && !showLoading && fileInputRef.current?.click()}
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
                  ${isHovered && isOwnProfile && !showLoading ? "brightness-75" : ""}
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
          {isOwnProfile && isHovered && !showLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <Camera className="h-8 w-8 text-white" />
            </div>
          )}

          {/* Uploading indicator */}
          {showLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
            </div>
          )}

          {/* Success checkmark overlay */}
          {!showLoading && isSuccess && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-green-500/80 backdrop-blur-sm animate-in fade-in duration-200">
              <Check className="h-8 w-8 text-white" />
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
        {isOwnProfile && displayUrl && !showLoading && !isSuccess && isHovered && (
          <button
            onClick={handleDelete}
            className="absolute -right-2 -top-2 rounded-full bg-accent-500 p-1.5 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)] hover:bg-accent-400 transition-all"
            title="Delete avatar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute left-1/2 -bottom-12 w-64 -translate-x-1/2 rounded-lg border border-accent-500/30 bg-accent-500/10 p-2 text-center text-xs text-accent-400 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {error}
        </div>
      )}

      {/* Success message */}
      {isSuccess && !error && !showLoading && (
        <div className="absolute left-1/2 -bottom-12 w-40 -translate-x-1/2 rounded-lg border border-green-500/30 bg-green-500/10 p-2 text-center text-xs text-green-400 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
          Avatar updated!
        </div>
      )}
    </div>
  );
});