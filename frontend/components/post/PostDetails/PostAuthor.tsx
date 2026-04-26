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
      <Link href={`/${username}`}>
        {avatarUrl ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-primary-500/30 hover:ring-primary-400/50 transition-all">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white font-medium ring-2 ring-primary-500/30 hover:ring-primary-400/50 transition-all">
            {username?.[0]?.toUpperCase()}
          </div>
        )}
      </Link>

      <div>
        <Link
          href={`/${username}`}
          className="font-semibold text-foreground hover:text-primary-400 transition-colors"
        >
          {username}
        </Link>
        <p
          className="text-xs text-muted-foreground cursor-help hover:text-primary-400 transition-colors"
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