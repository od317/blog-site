"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { getSocket, connectSocket } from "@/lib/socket/client";
import type { GroupedNotification } from "@/types/notification";

interface NotificationSocketData {
  type: string;
  postId?: string;
  postTitle?: string;
  commentId?: string;
  parentCommentId?: string;
  followerUsername?: string;
  followerFullName?: string;
  followerAvatar?: string;
}

export function useNotificationRealtime() {
  const { isAuthenticated, user } = useAuthStore();
  const { addOrUpdateNotification, refreshUnreadCount, removeNotification } =
    useNotificationStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      console.log("🔔 Stopping notification realtime - not authenticated");
      return;
    }
    if (initializedRef.current) {
      console.log("🔔 Notification realtime already initialized");
      return;
    }

    initializedRef.current = true;
    console.log("🔔 Initializing notification realtime for user:", user.id);

    const setupSocket = async () => {
      const socket = await connectSocket();

      if (!socket) {
        console.error("❌ Failed to get socket connection");
        return;
      }

      console.log("🔔 Socket connected, setting up notification listeners");

      const handleNewNotification = async (data: NotificationSocketData) => {
        console.log("🔔🔔🔔 NEW NOTIFICATION RECEIVED! 🔔🔔🔔", data);

        const now = new Date().toISOString();
        const notificationId = data.postId
          ? `${data.postId}-${data.type}-${Date.now()}`
          : `follow-${data.followerUsername}-${Date.now()}`;

        let groupedNotification: GroupedNotification;

        if (data.type === "follow") {
          groupedNotification = {
            type: "follow",
            post_id: null,
            post_title: null,
            read: false,
            created_at: now,
            actor_count: 1,
            actor_usernames: [data.followerUsername || "Someone"],
            actor_full_names: [data.followerFullName || null],
            actor_avatars: [data.followerAvatar || null],
            latest_actor_username: data.followerUsername || "Someone",
            latest_actor_full_name: data.followerFullName || null,
            latest_actor_avatar: data.followerAvatar || null,
            notification_id: notificationId,
            comment_ids: [],
            comment_previews: [],
            latest_comment_id: undefined,
            latest_comment_preview: undefined,
          };
        } else {
          groupedNotification = {
            type: data.type,
            post_id: data.postId || null,
            post_title: data.postTitle || null,
            read: false,
            created_at: now,
            actor_count: 1,
            actor_usernames: ["Someone"],
            actor_full_names: [null],
            actor_avatars: [null],
            latest_actor_username: "Someone",
            latest_actor_full_name: null,
            latest_actor_avatar: null,
            notification_id: notificationId,
            comment_ids: data.commentId ? [data.commentId] : [],
            comment_previews: [],
            latest_comment_id: data.commentId || undefined,
            latest_comment_preview: undefined,
          };
        }

        addOrUpdateNotification(groupedNotification);
        await refreshUnreadCount();
      };

      const handleNotificationRemoved = async (data: {
        type: string;
        postId: string;
        commentId?: string;
        parentCommentId?: string;
        actorId: string;
      }) => {
        console.log("🗑️ Notification removed:", data);
        removeNotification(data.type, data.postId, data.actorId);
        await refreshUnreadCount();
      };

      socket.on("new-notification", handleNewNotification);
      socket.on("notification-removed", handleNotificationRemoved);

      console.log("✅ Notification listeners registered");
    };

    setupSocket();

    return () => {
      console.log("🔔 Cleaning up notification listeners");
      const socket = getSocket();
      if (socket) {
        socket.off("new-notification");
        socket.off("notification-removed");
      }
      initializedRef.current = false;
    };
  }, [
    isAuthenticated,
    user?.id,
    addOrUpdateNotification,
    refreshUnreadCount,
    removeNotification,
  ]);
}
