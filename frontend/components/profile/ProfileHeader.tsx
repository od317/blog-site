"use client";

import { useState } from "react";
import { UserProfile } from "@/types/Profile";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileInfo } from "./ProfileInfo";
import { ProfileStats } from "./ProfileStats";
import { ProfileActions } from "./ProfileActions";
import { useProfileData } from "@/lib/hooks/useProfileData";

interface ProfileHeaderProps {
  initialProfile: UserProfile;
}

export function ProfileHeader({ initialProfile }: ProfileHeaderProps) {
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url);
  const [isUploading, setIsUploading] = useState(false);

  const {
    displayIsFollowing,
    displayFollowersCount,
    displayIsOwnProfile,
    isLoading: isFollowLoading,
    handleFollowToggle,
  } = useProfileData({
    username: initialProfile.username,
    profileUserId: initialProfile.id,
    initialIsFollowing: initialProfile.isFollowing,
    initialFollowersCount: initialProfile.followers_count,
    initialIsOwnProfile: initialProfile.isOwnProfile,
  });

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/proxy/profile/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setAvatarUrl(data.avatarUrl);
      } else {
        setAvatarUrl(initialProfile.avatar_url);
        alert(data.error || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      setAvatarUrl(initialProfile.avatar_url);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploading(true);

    // Don't set avatarUrl to null here - let the child component handle optimistic update
    // The child component will clear its display immediately

    try {
      const response = await fetch("/api/proxy/profile/avatar", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert will happen via avatarUrl prop not changing
        alert(data.error || "Failed to delete avatar");
      } else {
        // ✅ Set avatarUrl to null in parent after successful deletion
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error("Failed to delete avatar:", error);
      alert("Failed to delete avatar. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
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
          fullName={initialProfile.full_name}
          username={initialProfile.username}
          bio={initialProfile.bio}
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
        />
      </div>
    </div>
  );
}
