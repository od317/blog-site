"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLikeRealtime } from "@/lib/hooks/Likes/useLikeRealtime";
import { useLikeActions } from "@/lib/hooks/Likes/useLikeActions";
import { useRouter } from "next/navigation";

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

  // Local state
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  // Fetch initial like status
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      setHasLiked(false);
      setIsLoading(false);
      return;
    }

    const fetchLikeStatus = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
        const response = await fetch(`${baseUrl}/likes/${postId}/like`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setHasLiked(data.hasLiked);
          setLikeCount(data.likeCount);
        }
      } catch (error) {
        console.error("Failed to fetch like status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikeStatus();
  }, [postId, isAuthenticated, isAuthLoading]);

  // Handle like/unlike API call
  const { handleLike } = useLikeActions({
    postId,
    onSuccess: (newLikeCount, newHasLiked) => {
      setLikeCount(newLikeCount);
      setHasLiked(newHasLiked);
      setIsLiking(false);
    },
    onError: () => {
      // Revert optimistic update
      setLikeCount((prev) => (hasLiked ? prev - 1 : prev + 1));
      setHasLiked((prev) => !prev);
      setIsLiking(false);
    },
  });

  // Real-time updates
  useLikeRealtime({
    postId,
    onLikeUpdated: (
      updatedPostId,
      newLikeCount,
      action,
      shouldUpdateUserStatus,
    ) => {
      // Update like count for everyone
      setLikeCount(newLikeCount);

      // Only update user's like status if this is their own action
      if (shouldUpdateUserStatus) {
        setHasLiked(action === "liked");
      }
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

    // Optimistic update
    const newHasLiked = !hasLiked;
    const newLikeCount = newHasLiked ? likeCount + 1 : likeCount - 1;

    setHasLiked(newHasLiked);
    setLikeCount(newLikeCount);
    setIsLiking(true);

    await handleLike(newHasLiked);
  };

  // Loading state
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <span>❤️</span>
        <span className="text-sm">{likeCount}</span>
      </div>
    );
  }

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
