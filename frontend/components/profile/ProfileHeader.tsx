"use client";

import { useState, useCallback } from "react";
import { UserProfile } from "@/types/Profile";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileStats } from "./ProfileStats";
import { ProfileActions } from "./ProfileActions";
import { useProfileData } from "@/lib/hooks/useProfileData";
import { uploadAvatar, deleteAvatar } from "@/app/actions/profile.actions";
import { EditFullNameModal } from "./EditProfileModal";

interface ProfileHeaderProps {
  initialProfile: UserProfile;
}

export function ProfileHeader({ initialProfile }: ProfileHeaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialProfile.avatar_url,
  );
  const [fullName, setFullName] = useState<string | null>(
    initialProfile.full_name,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    displayIsFollowing,
    displayFollowersCount,
    displayIsOwnProfile,
    isLoading: isFollowLoading,
    handleFollowToggle: handleFollowToggleBase,
  } = useProfileData({
    username: initialProfile.username,
    profileUserId: initialProfile.id,
    initialIsFollowing: initialProfile.isFollowing,
    initialFollowersCount: initialProfile.followers_count,
    initialIsOwnProfile: initialProfile.isOwnProfile,
  });

  const handleFollowToggle = useCallback(async () => {
    await handleFollowToggleBase();
  }, [handleFollowToggleBase]);

  const handleAvatarUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("avatar", file);

      try {
        const result = await uploadAvatar(initialProfile.username, formData);

        if (result.success && result.avatarUrl) {
          setAvatarUrl(result.avatarUrl);
        } else {
          alert(result.error || "Failed to upload avatar");
        }
      } catch (error) {
        console.error("Failed to upload avatar:", error);
        alert("Failed to upload avatar. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [initialProfile.username],
  );

  const handleAvatarDelete = useCallback(async () => {
    setIsUploading(true);

    try {
      const result = await deleteAvatar(initialProfile.username);

      if (result.success) {
        setAvatarUrl(null);
      } else {
        alert(result.error || "Failed to delete avatar");
      }
    } catch (error) {
      console.error("Failed to delete avatar:", error);
      alert("Failed to delete avatar. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [initialProfile.username]);

  const handleFullNameUpdate = useCallback((newFullName: string | null) => {
    setFullName(newFullName);
  }, []);

  return (
    <>
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center">
          <ProfileAvatar
            username={initialProfile.username}
            avatarUrl={avatarUrl}
            isOwnProfile={displayIsOwnProfile}
            onAvatarUpload={handleAvatarUpload}
            onAvatarDelete={handleAvatarDelete}
            isUploading={isUploading}
          />

          <ProfileInfo
            username={initialProfile.username}
            fullName={fullName}
            onEditClick={() => setIsEditModalOpen(true)}
            isOwnProfile={displayIsOwnProfile}
          />

          <ProfileStats
            postsCount={initialProfile.posts_count}
            followersCount={displayFollowersCount}
            followingCount={initialProfile.following_count}
            totalLikesReceived={initialProfile.total_likes_received}
          />

          <ProfileActions
            isOwnProfile={displayIsOwnProfile}
            isFollowing={displayIsFollowing}
            isLoading={isFollowLoading}
            onFollowToggle={handleFollowToggle}
            onEditProfile={() => setIsEditModalOpen(true)}
          />
        </div>
      </div>

      <EditFullNameModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        username={initialProfile.username}
        currentFullName={fullName}
        onSuccess={handleFullNameUpdate}
      />
    </>
  );
}
