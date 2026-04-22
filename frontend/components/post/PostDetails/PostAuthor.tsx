// components/post/PostDetails/PostAuthor.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState } from "react";
import { formatFullDate, formatRelativeTime } from "@/lib/utils/dateFormatter";

interface PostAuthorProps {
  username: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export const PostAuthor = memo(function PostAuthor({
  username,
  avatarUrl,
  createdAt,
}: PostAuthorProps) {
  const [showFullDate, setShowFullDate] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        <div className="relative h-10 w-10 overflow-hidden rounded-full">
          <Image
            src={avatarUrl}
            alt={username}
            fill
            className="object-cover"
            sizes="40px"
            priority
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
          {username?.[0]?.toUpperCase()}
        </div>
      )}

      <div>
        <Link
          href={`/${username}`}
          className="font-semibold hover:text-blue-600 transition-colors"
        >
          {username}
        </Link>
        <p
          className="text-xs text-gray-500 cursor-help"
          onClick={() => setShowFullDate(!showFullDate)}
          title={formatFullDate(createdAt)}
        >
          {showFullDate
            ? formatFullDate(createdAt)
            : formatRelativeTime(createdAt)}
        </p>
      </div>
    </div>
  );
});
