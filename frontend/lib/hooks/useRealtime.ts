// lib/hooks/useRealtime.ts
"use client";

import { useEffect, useRef, useState } from "react";
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
  onReadersCountUpdated,
} from "@/lib/socket/client";
import { roomManager } from "@/lib/socket/roomManager";
import type {
  GroupedNotification,
  NotificationRemovedData,
  NotificationSocketData,
} from "@/types/notification";

// ──────────────────────────────────────────────
// GLOBAL STATE (survives re-renders)
// ──────────────────────────────────────────────
let SOCKET_READY = false;
let CLEANUP_FNS: (() => void)[] = [];
let INIT_COUNT = 0;

// ──────────────────────────────────────────────
// HOOK: useRealtime (global, called once in layout)
// ──────────────────────────────────────────────
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

  // Track current auth state in a ref (so listeners use latest user)
  const userRef = useRef(user);
  userRef.current = user;

  console.log(
    `[useRealtime] Render #${++INIT_COUNT} | isAuthenticated=${isAuthenticated} | socketReady=${SOCKET_READY}`,
  );

  useEffect(() => {
    console.log(
      `[useRealtime:Effect-1] Running | isAuthenticated=${isAuthenticated} | socketReady=${SOCKET_READY}`,
    );

    // ── CASE 1: Authenticated, socket not initialized ──
    if (isAuthenticated && !SOCKET_READY) {
      console.log("🔌 [INIT] Starting socket initialization...");
      SOCKET_READY = true; // Mark immediately to prevent double init

      const setup = async () => {
        try {
          console.log("🔌 [INIT] Calling connectSocket()...");
          const socket = await connectSocket();
          console.log(
            "🔌 [INIT] Socket returned, connected:",
            socket?.connected,
            "id:",
            socket?.id,
          );

          // ── Auth listener ──
          const unsubAuth = onAuthenticated((data) => {
            console.log("✅ [AUTH] Socket authenticated:", data);
            subscribeToFeed();
            console.log("📡 [FEED] Subscribed to feed");
          });
          console.log("👂 [LISTENER] Registered: authenticated");

          // ── Subscribed listener ──
          const unsubSub = onSubscribed((data) => {
            console.log("✅ [SUBSCRIBED] Channel:", data.channel);
          });
          console.log("👂 [LISTENER] Registered: subscribed");

          // ── New post ──
          const unsubNewPost = onNewPost((post) => {
            const currentUser = userRef.current;
            console.log(
              `📢 [NEW POST] id=${post.id} by=${post.user_id} | myId=${currentUser?.id}`,
            );
            if (post.user_id !== currentUser?.id) {
              addNewPost(post);
              console.log("✅ [NEW POST] Added to store");
            }
          });
          console.log("👂 [LISTENER] Registered: new-post");

          // ── Post updated ──
          const unsubPostUpdated = onPostUpdated((post) => {
            console.log(`📢 [POST UPDATED] id=${post.id}`);
            updatePostInList(post);
          });
          console.log("👂 [LISTENER] Registered: post-updated");

          // ── Post deleted ──
          const unsubPostDeleted = onPostDeleted(({ id }) => {
            console.log(`📢 [POST DELETED] id=${id}`);
            removePost(id);
          });
          console.log("👂 [LISTENER] Registered: post-deleted");

          // ── Like updated ──
          const unsubLike = onLikeUpdated(
            ({ postId, likeCount, userId, action }) => {
              console.log(
                `❤️ [LIKE] post=${postId} count=${likeCount} action=${action} by=${userId}`,
              );
              updateLikeCount(postId, likeCount, action === "liked");
            },
          );
          console.log("👂 [LISTENER] Registered: like-updated");

          // ── New comment ──
          const unsubComment = onNewComment((comment) => {
            console.log(
              `💬 [COMMENT] post=${comment.post_id} id=${comment.id}`,
            );
            // Update comment count in store
            const store = usePostStore.getState();
            const post = store.posts.find((p) => p.id === comment.post_id);
            if (post) {
              const currentCount =
                typeof post.comment_count === "string"
                  ? parseInt(post.comment_count, 10)
                  : post.comment_count;
              store.updateCommentCount(comment.post_id, currentCount + 1);
              console.log(`✅ [COMMENT] Updated count to ${currentCount + 1}`);
            }
          });
          console.log("👂 [LISTENER] Registered: new-comment");

          // ── Notifications ──
          const handleNewNotification = (data: NotificationSocketData) => {
            // Use getState() instead of closure to always have latest function
            console.log(
              `🔔 [NOTIFICATION] type=${data.type} postId=${data.postId}`,
            );

            const now = new Date().toISOString();
            const notificationId = data.postId
              ? `${data.postId}-${data.type}-${Date.now()}`
              : `follow-${data.followerUsername}-${Date.now()}`;

            // Build notification object (simplified for log clarity)
            const notification: GroupedNotification =
              data.type === "follow"
                ? {
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
                  }
                : {
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

            useNotificationStore
              .getState()
              .addOrUpdateNotification(notification);
            useNotificationStore.getState().refreshUnreadCount();
            console.log("✅ [NOTIFICATION] Added to store");
          };

          socket.on("new-notification", handleNewNotification);
          console.log("👂 [LISTENER] Registered: new-notification");

          const handleNotificationRemoved = (data: NotificationRemovedData) => {
            console.log(`🗑️ [NOTIFICATION REMOVED]`, data);
            useNotificationStore.getState().refreshUnreadCount();
          };
          socket.on("notification-removed", handleNotificationRemoved);
          console.log("👂 [LISTENER] Registered: notification-removed");

          // ── Store cleanup functions ──
          CLEANUP_FNS = [
            unsubAuth,
            unsubSub,
            unsubNewPost,
            unsubPostUpdated,
            unsubPostDeleted,
            unsubLike,
            unsubComment,
            () => socket.off("new-notification", handleNewNotification),
            () => socket.off("notification-removed", handleNotificationRemoved),
          ];

          console.log(
            `✅ [INIT] Complete! ${CLEANUP_FNS.length} listeners registered`,
          );
        } catch (error) {
          console.error("❌ [INIT] Failed:", error);
          SOCKET_READY = false; // Allow retry
        }
      };

      setup();
    }

    // ── CASE 2: Not authenticated, socket was initialized ──
    if (!isAuthenticated && SOCKET_READY) {
      console.log("🔌 [LOGOUT] Cleaning up socket...");
      CLEANUP_FNS.forEach((fn) => fn());
      CLEANUP_FNS = [];
      disconnectSocket();
      SOCKET_READY = false;
      console.log("✅ [LOGOUT] Complete");
    }

    // No cleanup on re-renders
    return () => {};
  }, [isAuthenticated]);

  // ── Effect 2: Cleanup on component unmount (app close) ──
  useEffect(() => {
    return () => {
      console.log("🔌 [UNMOUNT] App unmounting, final cleanup...");
      if (SOCKET_READY) {
        CLEANUP_FNS.forEach((fn) => fn());
        CLEANUP_FNS = [];
        disconnectSocket();
        SOCKET_READY = false;
        console.log("✅ [UNMOUNT] Cleanup complete");
      }
    };
  }, []);
}

// ──────────────────────────────────────────────
// HOOK: usePostRoom (join/leave post rooms)
// ──────────────────────────────────────────────
export function usePostRoom(postId: string) {
  const roomName = `post-${postId}`;
  const hasJoined = useRef(false);
  const retryCount = useRef(0);

  useEffect(() => {
    console.log(`[usePostRoom:Effect] Mount for post=${postId}`);
    let mounted = true;

    const join = async () => {
      const socket = getSocket();
      console.log(
        `🚪 [ROOM] Attempting to join ${roomName} | socket exists=${!!socket} | connected=${socket?.connected}`,
      );

      if (!socket?.connected) {
        if (retryCount.current < 10) {
          retryCount.current++;
          console.log(
            `⏳ [ROOM] Socket not connected, retry ${retryCount.current}/10 in 1s`,
          );
          setTimeout(join, 1000);
        } else {
          console.error(`❌ [ROOM] Max retries reached for ${roomName}`);
        }
        return;
      }

      socket.emit("join-post", postId);
      hasJoined.current = true;
      retryCount.current = 0;
      console.log(`✅ [ROOM] Emitted join-post for ${roomName}`);

      // Register with room manager for reconnection
      roomManager.addRoom(roomName);
      console.log(
        `📝 [ROOM] Registered in roomManager. Active rooms:`,
        roomManager.getActiveRooms(),
      );

      // Listen for confirmation
      socket.once("post-joined", (data) => {
        console.log(`✅ [ROOM] Confirmed joined ${roomName}:`, data);
      });
    };

    // Start joining process
    join();

    return () => {
      mounted = false;
      console.log(`🚪 [ROOM] Cleanup for ${roomName}`);
      hasJoined.current = false;
      roomManager.removeRoom(roomName);

      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("leave-post", postId);
        console.log(`✅ [ROOM] Emitted leave-post for ${roomName}`);
      }
    };
  }, [postId]);

  return { roomName };
}

// ──────────────────────────────────────────────
// HOOK: usePostRealtime (post-specific listeners)
// ──────────────────────────────────────────────
export function usePostRealtime(postId: string) {
  const [readerCount, setReaderCount] = useState(0);

  console.log(
    `[usePostRealtime] Render for post=${postId} | readers=${readerCount}`,
  );

  useEffect(() => {
    console.log(`[usePostRealtime:Effect] Mount for post=${postId}`);

    const unsubReaders = onReadersCountUpdated(
      ({ postId: updatedPostId, count }) => {
        if (updatedPostId === postId) {
          console.log(`👁️ [READERS] post=${postId} count=${count}`);
          setReaderCount(count);
        }
      },
    );
    console.log(
      `👂 [LISTENER] Registered: readers-count-updated for post=${postId}`,
    );

    return () => {
      console.log(`🧹 [CLEANUP] Removing readers listener for post=${postId}`);
      unsubReaders();
    };
  }, [postId]);

  return { readerCount };
}
