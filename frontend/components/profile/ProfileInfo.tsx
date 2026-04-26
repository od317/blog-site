// components/profile/ProfileInfo.tsx
"use client";

interface ProfileInfoProps {
  username: string;
  fullName: string | null;
  onEditClick: () => void;
  isOwnProfile: boolean;
}

export function ProfileInfo({
  username,
  fullName,
  onEditClick,
  isOwnProfile,
}: ProfileInfoProps) {
  return (
    <div className="text-center mt-4">
      {fullName && (
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
          {fullName}
        </h1>
      )}
      <p className="text-muted-foreground mt-1">@{username}</p>
    </div>
  );
}