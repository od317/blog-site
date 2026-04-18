"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { LikeButton } from "./LikeButton";
import { getLikeStatus } from "@/app/actions/like.actions";

interface PostLikeStatusProps {
  postId: string;
  initialLikeCount: number;
}

export function PostLikeStatus({
  postId,
  initialLikeCount,
}: PostLikeStatusProps) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to load
    if (isAuthLoading) {
      return;
    }

    // If not authenticated, show default state
    if (!isAuthenticated) {
      setHasLiked(false);
      setIsLoading(false);
      return;
    }

    // Fetch like status using server action
    const fetchLikeStatus = async () => {
      try {
        const result = await getLikeStatus(postId);

        if (result.success) {
          console.log("PostLikeStatus fetched via server action:", {
            hasLiked: result.hasLiked,
            likeCount: result.likeCount,
          });
          setHasLiked(result.hasLiked || false);
          setLikeCount(result.likeCount || initialLikeCount);
        } else {
          console.error("Failed to fetch like status:", result.error);
          setHasLiked(false);
        }
      } catch (error) {
        console.error("Error fetching like status:", error);
        setHasLiked(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikeStatus();
  }, [postId, isAuthenticated, isAuthLoading, initialLikeCount]);

  // Show loading state while checking auth or fetching
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <span>❤️</span>
        <span className="text-sm">{likeCount}</span>
      </div>
    );
  }

  return (
    <LikeButton
      postId={postId}
      initialLikeCount={likeCount}
      initialHasLiked={hasLiked}
    />
  );
}
