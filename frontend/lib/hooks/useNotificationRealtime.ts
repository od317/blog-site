"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { getSocket } from "@/lib/socket/client";

interface NotificationSocketData {
  type: string;
  postId: string;
  postTitle: string;
}

export function useNotificationRealtime() {
  const { isAuthenticated, user } = useAuthStore();
  const { incrementUnreadCount, fetchNotifications } = useNotificationStore();
  console.log("notifications real time created")
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const socket = getSocket();
    if (!socket) return;

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    const handleNewNotification = async (data: NotificationSocketData) => {
      console.log("🔔 New notification received:", data);

      // Increment unread count
      incrementUnreadCount();

      // Refresh notifications to get the new one
      await fetchNotifications(true);
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);
    };
  }, [isAuthenticated, user?.id, incrementUnreadCount, fetchNotifications]);
}
