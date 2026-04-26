// components/post/LikeButton.tsx
"use client";

import { useLikeActions } from "@/lib/hooks/Likes/useLikeActions";
import { useLikeRealtime } from "@/lib/hooks/Likes/useLikeRealtime";
import { useLikeState } from "@/lib/hooks/Likes/useLikeState";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  useLikeRealtime({
    postId,
    onLikeUpdated: (postId, newLikeCount, action, shouldUpdateUserStatus) => {
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

    updateLike(newLikeCount, newHasLiked);
    setLoading(true);

    await handleLike(newHasLiked);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLiking}
      className={`flex items-center gap-1.5 transition-all ${
        hasLiked
          ? "text-accent-400"
          : "text-muted-foreground hover:text-accent-400"
      } ${isLiking ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={hasLiked ? "liked" : "unliked"}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart
            className={`h-5 w-5 ${
              hasLiked
                ? "fill-accent-400 text-accent-400"
                : "text-current"
            } ${hasLiked ? "drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]" : ""}`}
          />
        </motion.div>
      </AnimatePresence>
      <span className="text-sm font-medium">{likeCount}</span>
    </button>
  );
}