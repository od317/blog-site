"use client";

import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { UserProfile } from "@/types/Profile";
import { Button } from "@/components/ui/Button";
import { followUser, unfollowUser } from "@/app/actions/follow.actions";
import { useFollowRealtime } from "@/lib/hooks/useFollowRealtime";
import { useState } from "react";

interface ProfileHeaderProps {
  initialProfile: UserProfile;
}

export function ProfileHeader({ initialProfile }: ProfileHeaderProps) {
  const { isAuthenticated, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialProfile.isFollowing);
  const [followersCount, setFollowersCount] = useState(
    initialProfile.followers_count,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Set up real-time follow updates
  useFollowRealtime({
    profileUserId: initialProfile.id,
    onFollowersCountUpdate: (newCount: number, isFollowingState: boolean) => {
      setFollowersCount(newCount);
      setIsFollowing(isFollowingState);
    },
    currentUserId: user?.id,
  });

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsLoading(true);

    // Optimistic update
    const newIsFollowing = !isFollowing;
    const newFollowersCount = newIsFollowing
      ? followersCount + 1
      : followersCount - 1;

    setIsFollowing(newIsFollowing);
    setFollowersCount(newFollowersCount);

    try {
      if (newIsFollowing) {
        const result = await followUser(initialProfile.id);
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await unfollowUser(initialProfile.id);
        if (!result.success) throw new Error(result.error);
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(!newIsFollowing);
      setFollowersCount(newIsFollowing ? followersCount : followersCount + 1);
      console.error("Follow action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isOwnProfile = user?.id === initialProfile.id;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center">
        {/* Avatar */}
        <div className="relative h-32 w-32 overflow-hidden rounded-full">
          {initialProfile.avatar_url ? (
            <Image
              src={initialProfile.avatar_url}
              alt={initialProfile.username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white">
              {initialProfile.username[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {initialProfile.full_name || initialProfile.username}
        </h1>

        <p className="text-gray-500">@{initialProfile.username}</p>

        {initialProfile.bio && (
          <p className="mt-2 text-center text-gray-700">{initialProfile.bio}</p>
        )}

        <div className="mt-4 flex gap-6">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {initialProfile.posts_count}
            </div>
            <div className="text-sm text-gray-500">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {followersCount}
            </div>
            <div className="text-sm text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {initialProfile.following_count}
            </div>
            <div className="text-sm text-gray-500">Following</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {initialProfile.total_likes_received}
            </div>
            <div className="text-sm text-gray-500">Likes</div>
          </div>
        </div>

        {isOwnProfile ? (
          <Button variant="outline" className="mt-4">
            Edit Profile
          </Button>
        ) : (
          <Button
            onClick={handleFollowToggle}
            isLoading={isLoading}
            variant={isFollowing ? "outline" : "primary"}
            className="mt-4"
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        )}
      </div>
    </div>
  );
}
