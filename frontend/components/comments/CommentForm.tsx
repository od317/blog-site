// components/comments/CommentForm.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";

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
        className="mb-3 w-full rounded-lg border border-primary-500/20 bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/50 disabled:opacity-50 transition-all resize-none"
        rows={3}
      />
      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={!content.trim() || !isAuthenticated}
      >
        <Send className="h-4 w-4 mr-1" />
        Post Comment
      </Button>
    </form>
  );
}