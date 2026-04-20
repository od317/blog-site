"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function CreatePostForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
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

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content.trim());
    if (imageFile) {
      formData.append("image", imageFile);
    }

    startTransition(async () => {
      try {
        // Use fetch directly with FormData (server actions don't support FormData well)
        const response = await fetch("/api/proxy/posts", {
          method: "POST",
          credentials: "include",
          body: formData, // Don't set Content-Type, browser will set it with boundary
        });

        const data = await response.json();

        if (response.ok && data.id) {
          setSuccess("Post created successfully!");
          setTitle("");
          setContent("");
          removeImage();

          setTimeout(() => {
            router.push(`/posts/${data.id}`);
            router.refresh();
          }, 1500);
        } else {
          setError(data.error || "Failed to create post");
        }
      } catch (err) {
        setError("Failed to create post. Please try again.");
        console.error(err);
      }
    });
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
          disabled={isPending}
          className="text-lg font-medium"
        />

        {/* Image Upload */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Featured Image (Optional)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            JPG, PNG, GIF, or WebP. Max 5MB.
          </p>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="relative rounded-lg border border-gray-200 p-2">
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
              className="absolute right-4 top-4 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content Textarea */}
        <textarea
          placeholder="What's on your mind? (Markdown supported)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />

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

        <Button
          type="submit"
          isLoading={isPending}
          disabled={!title.trim() || !content.trim()}
          className="w-full sm:w-auto"
        >
          {isPending ? "Creating..." : "Publish Post"}
        </Button>
      </form>
    </Card>
  );
}
