"use client";

import { useState, useCallback } from "react";

interface UseLikeStateProps {
  initialLikeCount: number;
  initialHasLiked: boolean;
}

export function useLikeState({ initialLikeCount, initialHasLiked }: UseLikeStateProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isLiking, setIsLiking] = useState(false);

  const updateLike = useCallback((newLikeCount: number, newHasLiked: boolean) => {
    // Ensure we're working with numbers
    const count = typeof newLikeCount === 'string' ? parseInt(newLikeCount, 10) : newLikeCount;
    setLikeCount(count);
    setHasLiked(newHasLiked);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLiking(loading);
  }, []);

  const optimisticUpdate = useCallback(() => {
    const newHasLiked = !hasLiked;
    // ✅ Ensure we're doing numeric addition
    const currentCount = typeof likeCount === 'string' ? parseInt(likeCount, 10) : likeCount;
    const newLikeCount = newHasLiked ? currentCount + 1 : currentCount - 1;
    return { newHasLiked, newLikeCount };
  }, [hasLiked, likeCount]);

  const revertUpdate = useCallback((originalLikeCount: number, originalHasLiked: boolean) => {
    const count = typeof originalLikeCount === 'string' ? parseInt(originalLikeCount, 10) : originalLikeCount;
    setLikeCount(count);
    setHasLiked(originalHasLiked);
  }, []);

  return {
    likeCount,
    hasLiked,
    isLiking,
    updateLike,
    setLoading,
    optimisticUpdate,
    revertUpdate,
  };
}