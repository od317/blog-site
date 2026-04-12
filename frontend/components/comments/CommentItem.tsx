"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { CommentEditForm } from "./CommentEditForm";
import type { Comment } from "@/types/Post";

interface CommentItemProps {
  comment: Comment;
  isUpdating: boolean;
  onDelete: (commentId: string) => Promise<void>;
  onUpdate: (commentId: string, content: string) => Promise<void>;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function CommentItem({
  comment,
  isUpdating,
  onDelete,
  onUpdate,
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = isAuthenticated && user?.id === comment.user_id;
  const isPending = comment.id?.startsWith("temp-");

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setIsDeleting(true);
    await onDelete(comment.id!);
    setIsDeleting(false);
  };

  const handleUpdate = async (content: string) => {
    await onUpdate(comment.id!, content);
    setIsEditing(false);
  };

  return (
    <div
      className={`flex gap-3 border-b pb-3 ${isPending ? "opacity-60" : ""}`}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
        {comment.username?.[0]?.toUpperCase() || "?"}
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-semibold">{comment.username || "User"}</span>
            <span className="ml-2 text-xs text-gray-500">
              {isPending ? "Sending..." : formatDate(comment.created_at)}
            </span>
          </div>
          {isAuthor && !isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                disabled={isUpdating || isDeleting}
                className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isUpdating || isDeleting}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <CommentEditForm
            initialContent={comment.content}
            isUpdating={isUpdating}
            onSave={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <p className="mt-1 text-sm text-gray-700">
            {comment.content}
            {isPending && (
              <span className="ml-2 text-xs text-gray-400">(sending...)</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
