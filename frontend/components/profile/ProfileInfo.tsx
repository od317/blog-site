"use client";

interface ProfileInfoProps {
  fullName: string | null;
  username: string;
  bio: string | null;
}

export function ProfileInfo({ fullName, username, bio }: ProfileInfoProps) {
  return (
    <>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        {fullName || username}
      </h1>
      <p className="text-gray-500">@{username}</p>
      {bio && <p className="mt-2 text-center text-gray-700">{bio}</p>}
    </>
  );
}
