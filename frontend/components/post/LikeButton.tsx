"use client";

import { useLikeActions } from "@/lib/hooks/Likes/useLikeActions";
import { useLikeRealtime } from "@/lib/hooks/Likes/useLikeRealtime";
import { useLikeState } from "@/lib/hooks/Likes/useLikeState";
import { useAuth } from "@/lib/hooks/useAuth";
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
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const {
    likeCount,
    hasLiked,
    isLiking,
    updateLike,
    setLoading,
    optimisticUpdate,
    revertUpdate,
  } = useLikeState({ initialLikeCount, initialHasLiked });

  const { handleLike } = useLikeActions({
    postId,
    onSuccess: (newLikeCount, newHasLiked) => {
      updateLike(newLikeCount, newHasLiked);
      setLoading(false);
    },
    onError: () => {
      const { newHasLiked: wasLiked } = optimisticUpdate();
      revertUpdate(wasLiked ? likeCount - 1 : likeCount + 1, !wasLiked);
      setLoading(false);
    },
  });

  // ✅ Pass current user ID to real-time hook
  useLikeRealtime({
    postId,
    onLikeUpdated: (postId, newLikeCount, action, shouldUpdateUserStatus) => {
      // Only update user's like status if this event is from the current user
      const newHasLiked = shouldUpdateUserStatus
        ? action === "liked"
        : hasLiked;
      updateLike(newLikeCount, newHasLiked);
    },
    currentUserId: user?.id,
  });

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    const { newHasLiked, newLikeCount } = optimisticUpdate();

    // Optimistic update
    updateLike(newLikeCount, newHasLiked);
    setLoading(true);

    // Make API call
    await handleLike(newHasLiked);
  };

  return (
    <button
      onClick={handleClick}
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
