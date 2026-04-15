"use client";

import { likePost, unlikePost } from "@/app/actions/like.actions";
import { getSocket } from "@/lib/socket/client";

interface UseLikeActionsProps {
  postId: string;
  onSuccess: (likeCount: number, hasLiked: boolean) => void;
  onError: () => void;
}

export function useLikeActions({
  postId,
  onSuccess,
  onError,
}: UseLikeActionsProps) {
  const handleLike = async (newHasLiked: boolean) => {
    try {
      let result;
      if (newHasLiked) {
        result = await likePost(postId);
      } else {
        result = await unlikePost(postId);
      }

      if (result.success && result.likeCount !== undefined) {
        onSuccess(result.likeCount, newHasLiked);

        // Emit real-time update via socket
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("post:like", {
            postId,
            likeCount: result.likeCount,
            action: newHasLiked ? "liked" : "unliked",
          });
        }
      } else {
        onError();
        console.error("Like action failed:", result.error);
      }
    } catch (error) {
      onError();
      console.error("Like action failed:", error);
    }
  };

  return { handleLike };
}
