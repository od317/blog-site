"use client";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { NotificationItem } from "./NotificationItem";
import type { GroupedNotification } from "@/types/notification";

interface NotificationDropdownProps {
  notifications: GroupedNotification[];
  isLoading: boolean;
  hasMore: boolean;
  unreadCount: number;
  onNotificationClick: (notification: GroupedNotification) => void;
  onLoadMore: () => void;
  onMarkAllAsRead: () => void;
}

export function NotificationDropdown({
  notifications,
  isLoading,
  hasMore,
  unreadCount,
  onNotificationClick,
  onLoadMore,
  onMarkAllAsRead,
}: NotificationDropdownProps) {
  return (
    <div className="absolute right-0 mt-2 w-96 rounded-lg border border-primary-500/20 bg-card shadow-[0_0_20px_rgba(6,182,212,0.1)] z-50">
      <div className="flex items-center justify-between border-b border-primary-500/20 p-3">
        <h3 className="font-semibold text-foreground">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
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
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.notification_id}
                notification={notification}
                onClick={onNotificationClick}
              />
            ))}

            {hasMore && (
              <button
                onClick={onLoadMore}
                className="w-full p-3 text-center text-sm text-primary-400 hover:bg-primary-500/5 transition-colors"
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}