"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updatePost, deletePost } from "@/app/actions/post.actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { Post } from "@/types/Post";
import { getSocket } from "@/lib/socket/client";

interface EditPostFormProps {
  post: Post;
}

export function EditPostForm({ post }: EditPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
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

    startTransition(async () => {
      const result = await updatePost({
        id: post.id,
        title: title.trim(),
        content: content.trim(),
      });

      if (result.success) {
        setSuccess("Post updated successfully!");

        // Emit real-time update via WebSocket
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("edit-post", {
            postId: post.id,
            title: title.trim(),
            content: content.trim(),
          });
        }

        // Redirect after short delay
        setTimeout(() => {
          router.push(`/posts/${post.id}`);
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || "Failed to update post");
      }
    });
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await deletePost(post.id);

    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(result.error || "Failed to delete post");
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="mb-4 border-b pb-3">
        <h1 className="text-xl font-semibold text-gray-900">Edit Post</h1>
        <p className="text-sm text-gray-500">Make changes to your post</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending || isDeleting}
          className="text-lg font-medium"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            placeholder="Write your post content here... (Markdown supported)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPending || isDeleting}
            rows={12}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Character counter */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>{content.length} characters</span>
          <span>~{Math.ceil(content.split(/\s+/).length / 200)} min read</span>
        </div>

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

        <div className="flex gap-3">
          <Button
            type="submit"
            isLoading={isPending}
            disabled={isDeleting || !title.trim() || !content.trim()}
          >
            Save Changes
          </Button>

          <Link href={`/posts/${post.id}`}>
            <Button variant="outline" disabled={isPending || isDeleting}>
              Cancel
            </Button>
          </Link>

          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={isPending}
            className="ml-auto"
          >
            Delete Post
          </Button>
        </div>
      </form>
    </Card>
  );
}
