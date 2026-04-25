"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  savePost,
  unsavePost,
  getSaveStatus,
} from "@/app/actions/save.actions";

interface SaveButtonProps {
  postId: string;
}

export function SaveButton({ postId }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Check if post is saved using server action
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const checkSavedStatus = async () => {
      try {
        const result = await getSaveStatus(postId);
        if (result.success) {
          setIsSaved(result.hasSaved || false);
        }
      } catch (error) {
        console.error("Failed to check save status:", error);
      } finally {
        setIsLoading(false);
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

    setIsSubmitting(true);

    // Optimistic update
    const newSaved = !isSaved;
    setIsSaved(newSaved);

    try {
      let result;
      if (newSaved) {
        result = await savePost(postId);
      } else {
        result = await unsavePost(postId);
      }

      if (!result.success) {
        // Revert on error
        setIsSaved(!newSaved);
        console.error("Save action failed:", result.error);
      }
    } catch (error) {
      // Revert on error
      setIsSaved(!newSaved);
      console.error("Save action failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-1 text-gray-300 cursor-wait"
      >
        <span>☆</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSaveToggle}
      disabled={isSubmitting}
      className={`flex items-center gap-1 transition-colors ${
        isSaved ? "text-yellow-500" : "text-gray-500 hover:text-yellow-400"
      } ${isSubmitting ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
      title={isSaved ? "Remove from saved" : "Save post"}
    >
      <span>{isSaved ? "⭐" : "☆"}</span>
    </button>
  );
}
