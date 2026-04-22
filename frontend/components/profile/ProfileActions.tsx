// components/profile/ProfileActions.tsx
"use client";

import { Button } from "@/components/ui/Button";

interface ProfileActionsProps {
  isOwnProfile: boolean;
  isFollowing: boolean;
  isLoading: boolean;
  onFollowToggle: () => void;
  onEditProfile: () => void;
}

export function ProfileActions({
  isOwnProfile,
  isFollowing,
  isLoading,
  onFollowToggle,
  onEditProfile,
}: ProfileActionsProps) {
  if (isOwnProfile) {
    return (
      <Button variant="outline" className="mt-4" onClick={onEditProfile}>
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
