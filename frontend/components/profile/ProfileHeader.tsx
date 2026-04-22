// components/profile/ProfileHeader.tsx
"use client";

import { useState, useCallback } from "react";
import { UserProfile } from "@/types/Profile";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileStats } from "./ProfileStats";
import { ProfileActions } from "./ProfileActions";
import { useProfileData } from "@/lib/hooks/useProfileData";
import { uploadAvatar, deleteAvatar } from "@/app/actions/profile.actions";
import { EditProfileModal } from "./EditProfileModal";

interface ProfileHeaderProps {
  initialProfile: UserProfile;
}

export function ProfileHeader({ initialProfile }: ProfileHeaderProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialProfile.avatar_url,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: initialProfile.full_name,
    bio: initialProfile.bio,
  });

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

  // Wrap follow toggle with revalidation
  const handleFollowToggle = useCallback(async () => {
    await handleFollowToggleBase();
  }, [handleFollowToggleBase]);

  // Handle avatar upload using server action
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

  // Handle avatar delete using server action
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

  // Handle profile update
  const handleProfileUpdate = useCallback(
    (fullName: string | null, bio: string | null) => {
      setProfileData({ fullName, bio });
    },
    [],
  );

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
            fullName={profileData.fullName}
            username={initialProfile.username}
            bio={profileData.bio}
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

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        username={initialProfile.username}
        initialFullName={profileData.fullName}
        initialBio={profileData.bio}
        onSuccess={handleProfileUpdate}
      />
    </>
  );
}
