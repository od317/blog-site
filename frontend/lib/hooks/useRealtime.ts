import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { usePostStore } from "@/lib/store/postStore";
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

        const unsubscribeNewComment = onNewComment((comment) => {
          console.log("📢 Real-time: New comment on post", comment.post_id);
          updateCommentCount(comment.post_id);
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

        return () => {
          unsubscribeAuthenticated();
          unsubscribeSubscribed();
          unsubscribeNewPost();
          unsubscribePostUpdated();
          unsubscribePostDeleted();
          unsubscribeNewComment();
          unsubscribeLikeUpdated();
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
  }, [isAuthenticated, user?.id]);
}
