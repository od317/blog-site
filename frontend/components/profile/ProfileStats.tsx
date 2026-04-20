"use client";

interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  totalLikesReceived: number;
}

export function ProfileStats({
  postsCount,
  followersCount,
  followingCount,
  totalLikesReceived,
}: ProfileStatsProps) {
  const stats = [
    { label: "Posts", value: postsCount },
    { label: "Followers", value: followersCount },
    { label: "Following", value: followingCount },
    { label: "Likes", value: totalLikesReceived },
  ];

  return (
    <div className="mt-4 flex gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="text-xl font-bold text-gray-900">{stat.value}</div>
          <div className="text-sm text-gray-500">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
