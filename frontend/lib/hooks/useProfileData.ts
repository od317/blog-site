"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFollowRealtime } from "@/lib/hooks/useFollowRealtime";

interface ProfileDataResponse {
  isFollowing: boolean;
  isOwnProfile: boolean;
  followers_count: number;
}

interface UseProfileDataProps {
  username: string;
  profileUserId: string;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  initialIsOwnProfile: boolean;
}

export function useProfileData({
  username,
  profileUserId,
  initialIsFollowing,
  initialFollowersCount,
  initialIsOwnProfile,
}: UseProfileDataProps) {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isOwnProfile, setIsOwnProfile] = useState(initialIsOwnProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch fresh follow status
  useEffect(() => {
    if (isAuthLoading) return;

    const fetchFollowStatus = async () => {
      try {
        const response = await api.get<ProfileDataResponse>(
          `/profile/${username}`,
        );

        setIsFollowing(response.isFollowing);
        setFollowersCount(response.followers_count);
        setIsOwnProfile(response.isOwnProfile);
      } catch (error) {
        console.error("Failed to fetch dynamic profile data:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    fetchFollowStatus();
  }, [username, isAuthLoading]);

  // Real-time follow updates
  useFollowRealtime({
    profileUserId,
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

    const newIsFollowing = !isFollowing;
    const newFollowersCount = newIsFollowing
      ? followersCount + 1
      : followersCount - 1;

    setIsFollowing(newIsFollowing);
    setFollowersCount(newFollowersCount);

    try {
      if (newIsFollowing) {
        await api.post(`/profile/${profileUserId}/follow`);
      } else {
        await api.delete(`/profile/${profileUserId}/follow`);
      }
    } catch (error) {
      setIsFollowing(!newIsFollowing);
      setFollowersCount(newIsFollowing ? followersCount : followersCount + 1);
      console.error("Follow action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    followersCount,
    isOwnProfile,
    isLoading: isLoading || isAuthLoading,
    isInitialized,
    handleFollowToggle,
    displayIsFollowing: isInitialized ? isFollowing : initialIsFollowing,
    displayFollowersCount: isInitialized
      ? followersCount
      : initialFollowersCount,
    displayIsOwnProfile: isInitialized ? isOwnProfile : initialIsOwnProfile,
  };
}
