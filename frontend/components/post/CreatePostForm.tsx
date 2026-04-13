"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function CreatePostForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          credentials: "include",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      setSuccess("Post created successfully!");
      setTitle("");
      setContent("");

      router.refresh();

      setTimeout(() => {
        router.push(`/posts/${data.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    } finally {
      setIsLoading(false);
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
        <Input
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          className="text-lg font-medium"
        />

        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
            {success}
          </div>
        )}

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!title.trim() || !content.trim()}
          className="w-full sm:w-auto"
        >
          Publish Post
        </Button>
      </form>
    </Card>
  );
}
