"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";

// ============================================
// COMPONENT: Create Post Form
// RENDERING: Client Component
// WHY: Direct API call instead of server action for testing
// ============================================

export function CreatePostForm() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Check authentication
    if (!isAuthenticated) {
      setError("Please login to create a post");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
      return;
    }

    // Validate
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Direct API call using the api client (handles cookies automatically)
      const response = await api.post("/posts", {
        title: title.trim(),
        content: content.trim(),
      });

      setSuccess("Post created successfully!");
      setTitle("");
      setContent("");

      // Redirect after short delay
      // setTimeout(() => {
      //   // router.push(`/posts/${response.id}`);
      //   // router.refresh();
      // }, 1500);
    } catch (err: any) {
      console.error("Create post error:", err);
      setError(err.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-8">
      <div className="mb-4 border-b pb-3">
        <h2 className="text-lg font-semibold text-gray-900">Create New Post</h2>
        <p className="text-sm text-gray-500">
          Share your thoughts with the community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <Input
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          className="text-lg font-medium"
        />

        {/* Content Textarea */}
        <textarea
          placeholder="What's on your mind? (Markdown supported)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />

        {/* Character counter */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>{content.length} characters</span>
          <span>~{Math.ceil(content.split(/\s+/).length / 200)} min read</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!title.trim() || !content.trim()}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Creating..." : "Publish Post"}
        </Button>
      </form>
    </Card>
  );
}
