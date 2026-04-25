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
    <div className="text-center">
      {fullName && (
        <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
      )}
      <p className="text-gray-500">@{username}</p>
    </div>
  );
}
