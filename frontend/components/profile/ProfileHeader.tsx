"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { UserProfile } from "@/types/Profile";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api/client";

interface ProfileHeaderProps {
  initialProfile: UserProfile;
}

export function ProfileHeader({ initialProfile }: ProfileHeaderProps) {
  const { isAuthenticated } = useAuth();
  const [profile] = useState(initialProfile);
  const [isFollowing, setIsFollowing] = useState(initialProfile.isFollowing);
  const [followersCount, setFollowersCount] = useState(
    initialProfile.followers_count,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        await api.delete(`/profile/${profile.id}/follow`);
        setFollowersCount((prev) => prev - 1);
        setIsFollowing(false);
      } else {
        await api.post(`/profile/${profile.id}/follow`);
        setFollowersCount((prev) => prev + 1);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Follow action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center">
        <div className="relative h-32 w-32 overflow-hidden rounded-full">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white">
              {profile.username[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {profile.full_name || profile.username}
        </h1>

        <p className="text-gray-500">@{profile.username}</p>

        {profile.bio && (
          <p className="mt-2 text-center text-gray-700">{profile.bio}</p>
        )}

        <div className="mt-4 flex gap-6">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {profile.posts_count}
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
              {profile.following_count}
            </div>
            <div className="text-sm text-gray-500">Following</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {profile.total_likes_received}
            </div>
            <div className="text-sm text-gray-500">Likes</div>
          </div>
        </div>

        {!profile.isOwnProfile && (
          <Button
            onClick={handleFollowToggle}
            isLoading={isLoading}
            variant={isFollowing ? "outline" : "primary"}
            className="mt-4"
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        )}

        {profile.isOwnProfile && (
          <Button variant="outline" className="mt-4">
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  );
}
