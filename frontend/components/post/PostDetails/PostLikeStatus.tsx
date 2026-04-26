// components/post/PostDetails/PostLikeStatus.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useLikeRealtime } from "@/lib/hooks/Likes/useLikeRealtime";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PostLikeStatusProps {
  postId: string;
  initialLikeCount: number;
}

export function PostLikeStatus({
  postId,
  initialLikeCount,
}: PostLikeStatusProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      setHasLiked(false);
      setIsLoading(false);
      return;
    }

    const fetchLikeStatus = async () => {
      try {
        console.log("🔍 Fetching like status for post:", postId);

        const response = await api.get<{
          hasLiked: boolean;
          likeCount: number;
        }>(`/likes/${postId}/like`);

        console.log("🔍 Like status response:", response);

        setHasLiked(response.hasLiked);
        setLikeCount(response.likeCount);
      } catch (error) {
        console.error("Error fetching like status:", error);
        setHasLiked(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikeStatus();
  }, [postId, isAuthenticated, isAuthLoading]);

  const handleLikeUpdate = useCallback(
    (
      updatedPostId: string,
      newLikeCount: number,
      action: string,
      shouldUpdateUserStatus: boolean,
    ) => {
      if (updatedPostId !== postId) return;

      console.log("📡 Real-time like update received:", {
        updatedPostId,
        newLikeCount,
        action,
        shouldUpdateUserStatus,
        currentHasLiked: hasLiked,
      });

      setLikeCount(newLikeCount);

      if (shouldUpdateUserStatus) {
        const newHasLiked = action === "liked";
        console.log("📡 Updating user like status to:", newHasLiked);
        setHasLiked(newHasLiked);
      }
    },
    [postId, hasLiked],
  );

  useLikeRealtime({
    postId,
    onLikeUpdated: handleLikeUpdate,
    currentUserId: user?.id,
  });

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    const newHasLiked = !hasLiked;
    const newLikeCount = newHasLiked ? likeCount + 1 : likeCount - 1;

    setHasLiked(newHasLiked);
    setLikeCount(newLikeCount);
    setIsLiking(true);

    try {
      if (newHasLiked) {
        await api.post(`/likes/${postId}/like`);
      } else {
        await api.delete(`/likes/${postId}/like`);
      }
    } catch (error) {
      setHasLiked(!newHasLiked);
      setLikeCount(newHasLiked ? likeCount : likeCount + 1);
      console.error("Like action failed:", error);
    } finally {
      setIsLiking(false);
    }
  };

  // Loading state
  if (isAuthLoading || isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 text-muted-foreground cursor-wait"
      >
        <Heart className="h-5 w-5 animate-pulse" />
        <span className="text-sm font-medium">{likeCount}</span>
      </button>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <button
        onClick={() =>
          router.push(
            `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
          )
        }
        className="flex items-center gap-1.5 text-muted-foreground hover:text-accent-400 transition-colors group"
      >
        <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium">{likeCount}</span>
      </button>
    );
  }

  // Authenticated - interactive button
  return (
    <button
      onClick={handleLike}
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
                ? "fill-accent-400 text-accent-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]"
                : ""
            }`}
          />
        </motion.div>
      </AnimatePresence>
      <span className="text-sm font-medium">{likeCount}</span>
    </button>
  );
}