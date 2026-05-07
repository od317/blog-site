// lib/hooks/useRealtime.ts
import { useEffect, useRef } from "react";
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
  console.log("use realtime is re rendering");

  const {
    addNewPost,
    updatePostInList,
    removePost,
    updateLikeCount,
    updateCommentCount,
  } = usePostStore();
  const { addOrUpdateNotification, refreshUnreadCount } =
    useNotificationStore();

  // Track if listeners are already set up
  const isInitialized = useRef(false);
  const cleanupFunctions = useRef<(() => void)[]>([]);

  useEffect(() => {
    console.log(" the effect for intializing is being excuted");
    // Only initialize once when authenticated
    if (isAuthenticated && !isInitialized.current) {
      console.log("🔌 Initializing real-time connection...");
      isInitialized.current = true;

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

        // Notification listeners
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

        // Store cleanup functions
        cleanupFunctions.current = [
          unsubscribeAuthenticated,
          unsubscribeSubscribed,
          unsubscribeNewPost,
          unsubscribePostUpdated,
          unsubscribePostDeleted,
          unsubscribeLikeUpdated,
          () => {
            socket.off("new-notification", handleNewNotification);
            socket.off("notification-removed", handleNotificationRemoved);
          },
        ];
      };

      initSocket();
    }

    // Only cleanup on unmount (not on re-renders)
    return () => {
      // This runs when component truly unmounts (logout)
      // Don't cleanup on navigation
    };
  }, [isAuthenticated]); // Remove user?.id and store functions from deps

  // Separate effect for user-specific logic that should update
  useEffect(() => {
    // Handle user changes without re-initializing socket
    if (!isAuthenticated && isInitialized.current) {
      console.log("🔌 User logged out, cleaning up socket...");
      // Run cleanup
      cleanupFunctions.current.forEach((cleanup) => cleanup());
      cleanupFunctions.current = [];
      disconnectSocket();
      isInitialized.current = false;
    }
  }, [isAuthenticated]);

  // This effect ensures cleanup on actual unmount (not navigation)
  useEffect(() => {
    return () => {
      // Only runs on component unmount
      if (isInitialized.current) {
        console.log("🔌 Component unmounting, cleaning up socket...");
        cleanupFunctions.current.forEach((cleanup) => cleanup());
        cleanupFunctions.current = [];
        disconnectSocket();
        isInitialized.current = false;
      }
    };
  }, []);
}
