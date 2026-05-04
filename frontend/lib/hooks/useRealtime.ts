import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { usePostStore } from "@/lib/store/postStore";
import { useNotificationStore } from "@/lib/store/notificationStore";
import {
  connectSocket,
  disconnectSocket,
  onNewPost,
  onPostUpdated,
  onPostDeleted,
  onNewComment,
  onLikeUpdated,
  onAuthenticated,
  onSubscribed,
  subscribeToFeed,
  getSocket,
} from "@/lib/socket/client";
import type {
  GroupedNotification,
  NotificationRemovedData,
  NotificationSocketData,
} from "@/types/notification";

export function useRealtime() {
  const { isAuthenticated, user } = useAuthStore();
  const {
    addNewPost,
    updatePostInList,
    removePost,
    updateLikeCount,
    updateCommentCount,
  } = usePostStore();
  const { addOrUpdateNotification, refreshUnreadCount } =
    useNotificationStore();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("🔌 Initializing real-time connection...");

      const initSocket = async () => {
        const socket = await connectSocket();

        // Set up event listeners
        const unsubscribeAuthenticated = onAuthenticated((data) => {
          console.log("🔌 Socket authenticated:", data);
          subscribeToFeed();
        });

        const unsubscribeSubscribed = onSubscribed((data) => {
          console.log("🔌 Subscribed to channel:", data);
        });

        const unsubscribeNewPost = onNewPost((post) => {
          console.log("📢 Real-time: New post received", post);
          if (post.user_id !== user?.id) {
            addNewPost(post);
          }
        });

        const unsubscribePostUpdated = onPostUpdated((post) => {
          console.log("📢 Real-time: Post updated", post);
          updatePostInList(post);
        });

        const unsubscribePostDeleted = onPostDeleted(({ id }) => {
          console.log("📢 Real-time: Post deleted", id);
          removePost(id);
        });

        const unsubscribeLikeUpdated = onLikeUpdated(
          ({ postId, likeCount, userId, action }) => {
            console.log("❤️ Real-time: Like updated", {
              postId,
              likeCount,
              action,
            });
            updateLikeCount(postId, likeCount, action === "liked");
          },
        );

        // ✅ Add notification listeners with proper types
        const handleNewNotification = (data: NotificationSocketData) => {
          console.log("🔔🔔🔔 New notification received! 🔔🔔🔔", data);

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
          refreshUnreadCount();
        };

        const handleNotificationRemoved = (data: NotificationRemovedData) => {
          console.log("🗑️ Notification removed:", data);
          refreshUnreadCount();
        };

        socket.on("new-notification", handleNewNotification);
        socket.on("notification-removed", handleNotificationRemoved);

        return () => {
          unsubscribeAuthenticated();
          unsubscribeSubscribed();
          unsubscribeNewPost();
          unsubscribePostUpdated();
          unsubscribePostDeleted();
          unsubscribeLikeUpdated();
          socket.off("new-notification", handleNewNotification);
          socket.off("notification-removed", handleNotificationRemoved);
          disconnectSocket();
        };
      };

      const cleanupPromise = initSocket();

      return () => {
        cleanupPromise.then((cleanup) => cleanup?.());
      };
    } else {
      if (getSocket()?.connected) {
        disconnectSocket();
      }
    }
  }, [isAuthenticated, user?.id, addOrUpdateNotification, refreshUnreadCount]);
}
