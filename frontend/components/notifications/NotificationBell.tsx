"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
    markPostAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useNotificationRealtime();

  // ✅ Fetch unread count on mount using API client
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

  // Fetch notifications when dropdown opens
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
      await markPostAsRead(notification.post_id);
    }
    setIsOpen(false);
  };

  const getNotificationMessage = (
    notification: GroupedNotification,
  ): string => {
    const { actor_count, latest_actor_username, post_title } = notification;
    const otherCount = actor_count - 1;

    if (actor_count === 1) {
      return `${latest_actor_username} liked your post "${post_title || "a post"}"`;
    }

    if (actor_count === 2) {
      return `${latest_actor_username} and 1 other liked your post "${post_title || "a post"}"`;
    }

    return `${latest_actor_username} and ${otherCount} others liked your post "${post_title || "a post"}"`;
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
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-blue-500 hover:text-blue-600"
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
              <div className="py-8 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <Link
                    key={notification.notification_id}
                    href={`/posts/${notification.post_id}`}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block border-b p-3 transition-colors hover:bg-gray-50 ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      {notification.latest_actor_avatar ? (
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                          <Image
                            src={notification.latest_actor_avatar}
                            alt={notification.latest_actor_username}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-medium text-white">
                          {notification.latest_actor_username?.[0]?.toUpperCase() ||
                            "U"}
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="text-sm text-gray-700">
                          {getNotificationMessage(notification)}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>

                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </Link>
                ))}

                {hasMore && (
                  <button
                    onClick={() => fetchNotifications()}
                    className="w-full p-3 text-center text-sm text-blue-500 hover:bg-gray-50"
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
