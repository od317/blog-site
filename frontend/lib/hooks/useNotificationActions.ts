"use client";

import { useNotificationStore } from "@/lib/store/notificationStore";
import { api } from "@/lib/api/client";
import type { GroupedNotification } from "@/types/notification";

export function useNotificationActions() {
  const {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
    isLoading,
    hasMore,
  } = useNotificationStore();

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

  const handleNotificationClick = async (notification: GroupedNotification) => {
    if (!notification.read) {
      let actorId: string | undefined;
      if (notification.type === "follow" && notification.notification_id) {
        const parts = notification.notification_id.split("-");
        if (parts.length >= 2) {
          actorId = parts[1];
        }
      }
      
      await markAsRead(
        notification.notification_id,
        notification.type,
        notification.post_id,
        actorId
      );
    }
  };

  return {
    fetchInitialUnreadCount,
    handleNotificationClick,
    fetchNotifications,
    markAllAsRead,
    unreadCount,
    isLoading,
    hasMore,
  };
}