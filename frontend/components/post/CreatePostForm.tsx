"use client";

import { useState } from "react";
import { usePostStore } from "@/lib/store/postStore";
import { useNotification } from "@/lib/hooks/useNotification";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function CreatePostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPost } = usePostStore();
  const { showSuccess, showError } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      showError("Please enter both title and content");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost({ title: title.trim(), content: content.trim() });
      showSuccess("Post created!");
      setTitle("");
      setContent("");
    } catch (error: any) {
      showError(error.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
        />
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!title.trim() || !content.trim()}
        >
          Create Post
        </Button>
      </form>
    </Card>
  );
}
