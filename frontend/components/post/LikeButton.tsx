"use client";

import { useLikeActions } from "@/lib/hooks/Likes/useLikeActions";
import { useLikeRealtime } from "@/lib/hooks/Likes/useLikeRealtime";
import { useLikeState } from "@/lib/hooks/Likes/useLikeState";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number | string; // Allow both number and string
  initialHasLiked: boolean;
}

export function LikeButton({
  postId,
  initialLikeCount,
  initialHasLiked,
}: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Convert to number if it's a string
  const normalizedLikeCount =
    typeof initialLikeCount === "string"
      ? parseInt(initialLikeCount, 10)
      : initialLikeCount;

  const {
    likeCount,
    hasLiked,
    isLiking,
    updateLike,
    setLoading,
    optimisticUpdate,
    revertUpdate,
  } = useLikeState({
    initialLikeCount: normalizedLikeCount,
    initialHasLiked,
  });

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

  // Set up real-time listeners
  useLikeRealtime({
    postId,
    onLikeUpdated: (_, newLikeCount, action) => {
      const newHasLiked = action === "liked";
      updateLike(newLikeCount, newHasLiked);
    },
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
