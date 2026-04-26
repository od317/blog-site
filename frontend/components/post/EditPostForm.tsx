// components/post/EditPostForm.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { deletePost } from "@/app/actions/post.actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { Post } from "@/types/Post";
import { getSocket } from "@/lib/socket/client";
import { Upload, X, Save, ArrowLeft, Trash2 } from "lucide-react";

interface EditPostFormProps {
  post: Post;
}

export function EditPostForm({ post }: EditPostFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    post.image_url || null,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!title.trim()) {
      setError("Title is required");
      setIsSubmitting(false);
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imagePreview === null && post.image_url) {
        formData.append("removeImage", "true");
      }

      const response = await fetch(`/api/proxy/posts/${post.id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      console.log(response);
      const data = await response.json();

      if (response.ok) {
        setSuccess("Post updated successfully!");

        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("edit-post", {
            postId: post.id,
            title: title.trim(),
            content: content.trim(),
          });
        }

        setTimeout(() => {
          router.push(`/posts/${post.id}`);
          router.refresh();
        }, 1500);
      } else {
        setError(data.error || "Failed to update post");
      }
    } catch (err) {
      setError("Failed to update post. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
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
    <Card className="max-w-4xl mx-auto">
      <div className="mb-6 border-b border-primary-500/10 pb-4">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
          Edit Post
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Make changes to your post
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting || isDeleting}
          className="text-lg font-medium"
        />

        {/* Image Upload Section */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Featured Image
          </label>
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              disabled={isSubmitting || isDeleting}
              className="hidden"
              id="edit-file-upload"
            />
            <label
              htmlFor="edit-file-upload"
              className="flex items-center gap-2 w-full rounded-lg border border-primary-500/20 bg-card px-4 py-3 text-muted-foreground hover:border-primary-400/50 hover:text-primary-400 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm">
                {imageFile ? imageFile.name : imagePreview ? "Change image..." : "Choose an image..."}
              </span>
            </label>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, GIF, or WebP. Max 5MB.
          </p>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="relative rounded-lg border border-primary-500/20 p-2">
            <div className="relative h-48 w-full overflow-hidden rounded-lg">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-4 top-4 rounded-full bg-accent-500 p-1.5 text-white hover:bg-accent-400 shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Content
          </label>
          <textarea
            placeholder="Write your post content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting || isDeleting}
            rows={12}
            className="w-full rounded-lg border border-primary-500/20 bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/50 disabled:opacity-50 transition-all resize-none"
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{content.length} characters</span>
          <span>~{Math.ceil(content.split(/\s+/).length / 200)} min read</span>
        </div>

        {error && (
          <div className="rounded-lg bg-accent-500/10 border border-accent-500/20 p-3 text-sm text-accent-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-primary-500/10 border border-primary-500/20 p-3 text-sm text-primary-400">
            {success}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isDeleting || !title.trim() || !content.trim()}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </Button>

          <Link href={`/posts/${post.id}`}>
            <Button variant="outline" disabled={isSubmitting || isDeleting}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </Link>

          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
            disabled={isSubmitting}
            className="ml-auto"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Post
          </Button>
        </div>
      </form>
    </Card>
  );
}