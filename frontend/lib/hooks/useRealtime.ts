import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import {
  connectSocket,
  disconnectSocket,
  onNewPost,
  onPostUpdated,
  onPostDeleted,
  onNewComment,
  onLikeUpdated,
  getSocket,
} from "@/lib/socket/client";
import { usePostStore } from "../store/postStore";

export function useRealtime() {
  const { token, isAuthenticated } = useAuthStore();
  const {
    addNewPost,
    updatePostInList,
    removePost,
    updateLikeCount,
    updateCommentCount,
  } = usePostStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect socket when authenticated
      const socket = connectSocket(token);

      // Listen for new posts
      const unsubscribeNewPost = onNewPost((post) => {
        console.log("Real-time: New post received", post);
        addNewPost(post);
      });

      // Listen for post updates
      const unsubscribePostUpdated = onPostUpdated((post) => {
        console.log("Real-time: Post updated", post);
        updatePostInList(post);
      });

      // Listen for post deletions
      const unsubscribePostDeleted = onPostDeleted(({ id }) => {
        console.log("Real-time: Post deleted", id);
        removePost(id);
      });

      // Listen for new comments
      const unsubscribeNewComment = onNewComment((comment) => {
        console.log("Real-time: New comment on post", comment.post_id);
        updateCommentCount(comment.post_id);
      });

      // Listen for like updates
      const unsubscribeLikeUpdated = onLikeUpdated(
        ({ postId, likeCount, userId, action }) => {
          console.log("Real-time: Like updated", { postId, likeCount, action });
          // Update like count in store
          updateLikeCount(postId, likeCount, action === "liked");
        },
      );

      // Cleanup on unmount
      return () => {
        unsubscribeNewPost();
        unsubscribePostUpdated();
        unsubscribePostDeleted();
        unsubscribeNewComment();
        unsubscribeLikeUpdated();
        disconnectSocket();
      };
    } else {
      // Disconnect when logged out
      if (getSocket()?.connected) {
        disconnectSocket();
      }
    }
  }, [
    isAuthenticated,
    token,
    addNewPost,
    updatePostInList,
    removePost,
    updateLikeCount,
    updateCommentCount,
  ]);
}
