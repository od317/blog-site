"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { LikeButton } from "./LikeButton";

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
          method: "GET",
          credentials: "include", // ✅ This is critical - sends cookies
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("PostLikeStatus fetched:", data);
          setHasLiked(data.hasLiked);
          setLikeCount(data.likeCount);
        } else if (response.status === 401) {
          console.log("Unauthorized, token may be expired");
          setHasLiked(false);
        }
      } catch (error) {
        console.error("Failed to fetch like status:", error);
        setHasLiked(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikeStatus();
  }, [postId, isAuthenticated, isAuthLoading]);

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
