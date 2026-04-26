// components/profile/ProfileActions.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { UserPlus, UserCheck, Pencil } from "lucide-react";

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
      <Button variant="outline" className="mt-6" onClick={onEditProfile}>
        <Pencil className="h-4 w-4 mr-1" />
        Edit Profile
      </Button>
    );
  }

  return (
    <Button
      onClick={onFollowToggle}
      isLoading={isLoading}
      variant={isFollowing ? "outline" : "primary"}
      className="mt-6"
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-4 w-4 mr-1" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
}