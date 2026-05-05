"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  const fetchedPostIdRef = useRef<string | null>(null);

  // Update likeCount when initialLikeCount changes from parent
  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  // Fetch like status on client side
  useEffect(() => {
    if (isAuthLoading) return;

    // Reset state when postId changes
    if (fetchedPostIdRef.current !== postId) {
      console.log("🔄 Post changed, resetting like state for post:", postId);
      setHasLiked(false);
      setLikeCount(initialLikeCount);
      setIsLoading(true);
      fetchedPostIdRef.current = postId;
    }

    if (!isAuthenticated) {
      setHasLiked(false);
      setIsLoading(false);
      return;
    }

    // Skip if we already fetched for this post
    if (fetchedPostIdRef.current === postId && !isLoading) {
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
  }, [postId, initialLikeCount, isAuthenticated, isAuthLoading, isLoading]);

  // Handle real-time updates from other users
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

      // Always update like count
      setLikeCount(newLikeCount);

      // Only update user's like status if this event is for the current user
      if (shouldUpdateUserStatus) {
        const newHasLiked = action === "liked";
        console.log("📡 Updating user like status to:", newHasLiked);
        setHasLiked(newHasLiked);
      }
    },
    [postId],
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

    // Optimistic update
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
      // Revert on error
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
