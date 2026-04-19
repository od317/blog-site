"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { UserProfile } from "@/types/Profile";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api/client";
import { useFollowRealtime } from "@/lib/hooks/useFollowRealtime";

interface ProfileHeaderProps {
  initialProfile: UserProfile;
}

export function ProfileHeader({ initialProfile }: ProfileHeaderProps) {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialProfile.isFollowing);
  const [followersCount, setFollowersCount] = useState(
    initialProfile.followers_count,
  );
  const [isOwnProfile, setIsOwnProfile] = useState(initialProfile.isOwnProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch fresh follow status using API route
  useEffect(() => {
    if (isAuthLoading) return;

    const fetchFollowStatus = async () => {
      console.log(
        "🔍 Fetching dynamic profile data for:",
        initialProfile.username,
      );

      try {
        // Use Next.js API route instead of direct backend call
        const response = await fetch(
          `/api/profile/${initialProfile.username}`,
          {
            credentials: "include",
          },
        );

        console.log("🔍 API route response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("🔍 Dynamic profile data received:", {
            isFollowing: data.isFollowing,
            isOwnProfile: data.isOwnProfile,
            followersCount: data.followersCount,
          });
          setIsFollowing(data.isFollowing);
          setFollowersCount(data.followersCount);
          setIsOwnProfile(data.isOwnProfile);
        } else {
          console.error(
            "Failed to fetch dynamic profile data:",
            response.status,
          );
        }
      } catch (error) {
        console.error("Failed to fetch dynamic profile data:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    fetchFollowStatus();
  }, [initialProfile.username, isAuthLoading]);

  // Set up real-time follow updates
  useFollowRealtime({
    profileUserId: initialProfile.id,
    onFollowersCountUpdate: (newCount: number, isFollowingState: boolean) => {
      console.log(
        "🔄 Real-time: Updating followers count to:",
        newCount,
        "isFollowing:",
        isFollowingState,
      );
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
        await api.post(`/profile/${initialProfile.id}/follow`);
      } else {
        await api.delete(`/profile/${initialProfile.id}/follow`);
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

  // Use the fetched values if initialized, otherwise fallback to initial
  const displayIsFollowing = isInitialized
    ? isFollowing
    : initialProfile.isFollowing;
  const displayFollowersCount = isInitialized
    ? followersCount
    : initialProfile.followers_count;
  const displayIsOwnProfile = isInitialized
    ? isOwnProfile
    : initialProfile.isOwnProfile;

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

        {/* Name */}
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {initialProfile.full_name || initialProfile.username}
        </h1>

        {/* Username */}
        <p className="text-gray-500">@{initialProfile.username}</p>

        {/* Bio */}
        {initialProfile.bio && (
          <p className="mt-2 text-center text-gray-700">{initialProfile.bio}</p>
        )}

        {/* Stats */}
        <div className="mt-4 flex gap-6">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {initialProfile.posts_count}
            </div>
            <div className="text-sm text-gray-500">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {displayFollowersCount}
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

        {/* Follow/Edit Button */}
        {displayIsOwnProfile ? (
          <Button variant="outline" className="mt-4">
            Edit Profile
          </Button>
        ) : (
          <Button
            onClick={handleFollowToggle}
            isLoading={isLoading}
            variant={displayIsFollowing ? "outline" : "primary"}
            className="mt-4"
          >
            {displayIsFollowing ? "Following" : "Follow"}
          </Button>
        )}
      </div>
    </div>
  );
}
