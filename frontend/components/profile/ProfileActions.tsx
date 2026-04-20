"use client";

import { Button } from "@/components/ui/Button";

interface ProfileActionsProps {
  isOwnProfile: boolean;
  isFollowing: boolean;
  isLoading: boolean;
  onFollowToggle: () => void;
}

export function ProfileActions({
  isOwnProfile,
  isFollowing,
  isLoading,
  onFollowToggle,
}: ProfileActionsProps) {
  if (isOwnProfile) {
    return (
      <Button variant="outline" className="mt-4">
        Edit Profile
      </Button>
    );
  }

  return (
    <Button
      onClick={onFollowToggle}
      isLoading={isLoading}
      variant={isFollowing ? "outline" : "primary"}
      className="mt-4"
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
