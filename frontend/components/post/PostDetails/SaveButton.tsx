// components/post/PostDetails/SaveButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  savePost,
  unsavePost,
  getSaveStatus,
} from "@/app/actions/save.actions";
import { Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SaveButtonProps {
  postId: string;
}

export function SaveButton({ postId }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

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
        setIsSaved(!newSaved);
        console.error("Save action failed:", result.error);
      }
    } catch (error) {
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
        className="flex items-center gap-1.5 text-muted-foreground/50 cursor-wait"
      >
        <Bookmark className="h-5 w-5 animate-pulse" />
      </button>
    );
  }

  return (
    <button
      onClick={handleSaveToggle}
      disabled={isSubmitting}
      className={`flex items-center gap-1.5 transition-all ml-auto ${
        isSaved
          ? "text-primary-400"
          : "text-muted-foreground hover:text-primary-400"
      } ${isSubmitting ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
      title={isSaved ? "Remove from saved" : "Save post"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isSaved ? "saved" : "unsaved"}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Bookmark
            className={`h-5 w-5 ${
              isSaved
                ? "fill-primary-400 text-primary-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]"
                : ""
            }`}
          />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}