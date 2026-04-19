"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { LikeButton } from "./LikeButton";
import { api } from "@/lib/api/client";

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

    // Fetch like status using API client
    const fetchLikeStatus = async () => {
      try {
        console.log("🔍 Fetching like status for post:", postId);

        // Use API client which handles cookies automatically
        const response = await api.get<{
          hasLiked: boolean;
          likeCount: number;
        }>(`/likes/${postId}/status`);

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
