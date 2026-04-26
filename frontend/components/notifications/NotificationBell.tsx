// components/notifications/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { useNotificationRealtime } from "@/lib/hooks/useNotificationRealtime";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { api } from "@/lib/api/client";
import type { GroupedNotification } from "@/types/notification";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useNotificationRealtime();

  useEffect(() => {
    const fetchInitialUnreadCount = async () => {
      try {
        const response = await api.get<{ count: number }>(
          "/notifications/unread-count",
        );
        useNotificationStore.setState({ unreadCount: response.count });
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchInitialUnreadCount();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(true);
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: GroupedNotification) => {
    if (!notification.read) {
      const actorId =
        notification.type === "follow" ? notification.actor_id : undefined;

      await markAsRead(
        notification.notification_id,
        notification.type,
        notification.post_id,
        actorId,
      );
    }
    setIsOpen(false);
  };

  const getDisplayNames = (notification: GroupedNotification): string => {
    const { actor_count, latest_actor_username, actor_usernames } = notification;
    const otherCount = actor_count - 1;

    if (actor_count === 1) return latest_actor_username;
    if (actor_count === 2) {
      const otherName = actor_usernames.find(
        (name) => name !== latest_actor_username,
      );
      return `${latest_actor_username} and ${otherName || "1 other"}`;
    }
    return `${latest_actor_username} and ${otherCount} others`;
  };

  const getNotificationHref = (notification: GroupedNotification): string => {
    if (notification.type === "follow") {
      return `/${notification.latest_actor_username}`;
    }
    if (notification.post_id) {
      return `/posts/${notification.post_id}`;
    }
    return "/";
  };

  const getNotificationMessage = (notification: GroupedNotification): string => {
    const { type, actor_count, post_title } = notification;
    const displayNames = getDisplayNames(notification);
    const postText = post_title ? `"${post_title}"` : "a post";

    if (type === "follow") {
      return `${displayNames} started following you`;
    }
    if (type === "save") {
      return `${displayNames} saved your post ${postText}`;
    }
    if (type === "comment") {
      return `${displayNames} commented on your post ${postText}`;
    }
    if (type === "reply") {
      return `${displayNames} replied to your comment on ${postText}`;
    }
    if (type === "reply_on_post") {
      return `${displayNames} replied on your post ${postText}`;
    }
    return `${displayNames} liked your post ${postText}`;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-muted-foreground hover:text-primary-400 hover:bg-primary-500/10 transition-all"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white shadow-[0_0_10px_rgba(236,72,153,0.5)] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 rounded-lg border border-primary-500/20 bg-card shadow-[0_0_20px_rgba(6,182,212,0.1)] z-50">
          <div className="flex items-center justify-between border-b border-primary-500/20 p-3">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <>
                {notifications.map((notification) => {
                  const href = getNotificationHref(notification);

                  return (
                    <Link
                      key={notification.notification_id}
                      href={href}
                      onClick={() => handleNotificationClick(notification)}
                      className={`block border-b border-primary-500/10 p-3 transition-colors hover:bg-primary-500/5 ${
                        !notification.read ? "bg-primary-500/5" : ""
                      }`}
                    >
                      <div className="flex gap-3">
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
                })}

                {hasMore && (
                  <button
                    onClick={() => fetchNotifications()}
                    className="w-full p-3 text-center text-sm text-primary-400 hover:bg-primary-500/5 transition-colors"
                  >
                    Load more
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}