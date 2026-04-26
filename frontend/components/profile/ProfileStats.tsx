// components/profile/ProfileStats.tsx
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
    <div className="mt-6 flex gap-8">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center group">
          <div className="text-xl font-bold text-foreground group-hover:text-primary-400 transition-colors">
            {stat.value}
          </div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}