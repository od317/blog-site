"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePostStore } from "@/lib/store/postStore";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number;
  initialHasLiked: boolean;
}

export function LikeButton({
  postId,
  initialLikeCount,
  initialHasLiked,
}: LikeButtonProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const { isAuthenticated } = useAuth();
  const { updateLikeCount } = usePostStore();
  const router = useRouter();

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    const newHasLiked = !hasLiked;
    const newLikeCount = newHasLiked ? likeCount + 1 : likeCount - 1;

    // Optimistic update
    setHasLiked(newHasLiked);
    setLikeCount(newLikeCount);
    setIsLiking(true);
    updateLikeCount(postId, newLikeCount, newHasLiked);

    try {
      if (newHasLiked) {
        await api.post(`/likes/${postId}/like`);
      } else {
        await api.delete(`/likes/${postId}/like`);
      }
    } catch (error) {
      // Revert on error
      setHasLiked(!newHasLiked);
      setLikeCount(newHasLiked ? likeCount : likeCount + 1);
      updateLikeCount(
        postId,
        newHasLiked ? likeCount : likeCount + 1,
        !newHasLiked,
      );
      console.error("Like action failed:", error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLiking}
      className={`flex items-center gap-1 transition-colors ${
        hasLiked ? "text-red-500" : "text-gray-500 hover:text-red-400"
      } ${isLiking ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
    >
      <span>{hasLiked ? "❤️" : "🤍"}</span>
      <span className="text-sm">{likeCount}</span>
    </button>
  );
}
