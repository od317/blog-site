import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { usePostStore } from "@/lib/store/postStore";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "@/lib/socket/client";
import {
  onNewPost,
  onPostUpdated,
  onPostDeleted,
  onNewComment,
  onLikeUpdated,
  onFeedLikeUpdated,
  onAuthenticated,
  onSubscribed,
} from "@/lib/socket/events";

export function useRealtime() {
  const { isAuthenticated, user } = useAuthStore();
  const {
    addNewPost,
    updatePostInList,
    removePost,
    updateLikeCount,
    updateCommentCount,
  } = usePostStore();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("🔌 Initializing real-time connection...");
      const socket = connectSocket();

      // Authentication events
      const unsubscribeAuth = onAuthenticated((data) => {
        console.log("🔌 Socket authenticated:", data);
        socket.emit("subscribe-feed");
      });

      const unsubscribeSubscribed = onSubscribed((data) => {
        console.log("🔌 Subscribed to channel:", data);
      });

      // Post events
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

      // Comment events
      const unsubscribeNewComment = onNewComment((comment) => {
        console.log("📢 Real-time: New comment on post", comment);
        updateCommentCount(comment.post_id);
      });

      // Like events
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

      const unsubscribeFeedLikeUpdated = onFeedLikeUpdated(
        ({ postId, likeCount, userId, action }) => {
          console.log("❤️ Feed real-time: Like updated", {
            postId,
            likeCount,
            action,
          });
          updateLikeCount(postId, likeCount, action === "liked");
        },
      );

      return () => {
        unsubscribeAuth();
        unsubscribeSubscribed();
        unsubscribeNewPost();
        unsubscribePostUpdated();
        unsubscribePostDeleted();
        unsubscribeNewComment();
        unsubscribeLikeUpdated();
        unsubscribeFeedLikeUpdated();
        disconnectSocket();
      };
    } else {
      if (getSocket()?.connected) {
        disconnectSocket();
      }
    }
  }, [
    isAuthenticated,
    user?.id,
    addNewPost,
    updatePostInList,
    removePost,
    updateLikeCount,
    updateCommentCount,
  ]);
}
