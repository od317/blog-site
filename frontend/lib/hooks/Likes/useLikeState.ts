"use client";

import { useState, useCallback } from "react";

interface UseLikeStateProps {
  initialLikeCount: number;
  initialHasLiked: boolean;
}

export function useLikeState({
  initialLikeCount,
  initialHasLiked,
}: UseLikeStateProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isLiking, setIsLiking] = useState(false);

  const updateLike = useCallback(
    (newLikeCount: number, newHasLiked: boolean) => {
      setLikeCount(newLikeCount);
      setHasLiked(newHasLiked);
    },
    [],
  );

  const setLoading = useCallback((loading: boolean) => {
    setIsLiking(loading);
  }, []);

  const optimisticUpdate = useCallback(() => {
    const newHasLiked = !hasLiked;
    const newLikeCount = newHasLiked ? likeCount + 1 : likeCount - 1;
    return { newHasLiked, newLikeCount };
  }, [hasLiked, likeCount]);

  const revertUpdate = useCallback(
    (originalLikeCount: number, originalHasLiked: boolean) => {
      setLikeCount(originalLikeCount);
      setHasLiked(originalHasLiked);
    },
    [],
  );

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
