"use client";

import Link from "next/link";
import Image from "next/image";
import type { GroupedNotification } from "@/types/notification";
import { formatTime, getNotificationHref, getNotificationMessage } from "@/lib/utils/notificationHelpers";

interface NotificationItemProps {
  notification: GroupedNotification;
  onClick: (notification: GroupedNotification) => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const href = getNotificationHref(notification);

  return (
    <Link
      href={href}
      onClick={() => onClick(notification)}
      className={`block border-b border-primary-500/10 p-3 transition-colors hover:bg-primary-500/5 ${
        !notification.read ? "bg-primary-500/5" : ""
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        {notification.latest_actor_avatar ? (
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-primary-500/30">
            <Image
              src={notification.latest_actor_avatar}
              alt={notification.latest_actor_username}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-medium text-white ring-2 ring-primary-500/30">
            {notification.latest_actor_username?.[0]?.toUpperCase() || "U"}
          </div>
        )}

        <div className="flex-1">
          <p className="text-sm text-foreground">
            {getNotificationMessage(notification)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTime(notification.created_at)}
          </p>
        </div>

        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-primary-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
        )}
      </div>
    </Link>
  );
}