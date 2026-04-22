"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";

interface SaveButtonProps {
  postId: string;
}

export function SaveButton({ postId }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Check if post is saved
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSavedStatus = async () => {
      try {
        const response = await api.get<{ hasSaved: boolean }>(
          `/saves/${postId}/save`,
        );
        setIsSaved(response.hasSaved);
      } catch (error) {
        console.error("Failed to check save status:", error);
      }
    };

    checkSavedStatus();
  }, [postId, isAuthenticated]);

  const handleSaveToggle = async () => {
    if (!isAuthenticated) {
      router.push(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    setIsLoading(true);

    // Optimistic update
    const newSaved = !isSaved;
    setIsSaved(newSaved);

    try {
      if (newSaved) {
        await api.post(`/saves/${postId}/save`);
      } else {
        await api.delete(`/saves/${postId}/save`);
      }
    } catch (error) {
      // Revert on error
      setIsSaved(!newSaved);
      console.error("Save action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSaveToggle}
      disabled={isLoading}
      className={`flex items-center gap-1 transition-colors ${
        isSaved ? "text-yellow-500" : "text-gray-500 hover:text-yellow-400"
      } ${isLoading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
      title={isSaved ? "Remove from saved" : "Save post"}
    >
      <span>{isSaved ? "⭐" : "☆"}</span>
      <span className="text-sm">Save</span>
    </button>
  );
}
