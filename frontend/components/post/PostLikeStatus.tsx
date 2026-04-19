"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { api } from "@/lib/api/client";
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
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  // Fetch like status
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
        className="flex items-center gap-1 text-gray-400 cursor-wait"
      >
        <span>❤️</span>
        <span className="text-sm">{likeCount}</span>
      </button>
    );
  }

  // Not authenticated - show disabled button
  if (!isAuthenticated) {
    return (
      <button
        onClick={() =>
          router.push(
            `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
          )
        }
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>🤍</span>
        <span className="text-sm">{likeCount}</span>
      </button>
    );
  }

  // Authenticated - interactive button
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
