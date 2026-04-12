"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface CommentFormProps {
  postId: string;
  isSubmitting: boolean;
  onSubmit: (content: string) => Promise<void>;
}

export function CommentForm({
  postId,
  isSubmitting,
  onSubmit,
}: CommentFormProps) {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onSubmit(content.trim());
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        placeholder={
          isAuthenticated ? "Write a comment..." : "Please login to comment"
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!isAuthenticated || isSubmitting}
        className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        rows={3}
      />
      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={!content.trim() || !isAuthenticated}
      >
        Post Comment
      </Button>
    </form>
  );
}
