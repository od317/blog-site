"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { CommentEditForm } from "./CommentEditForm";
import { ReplyForm } from "./ReplyForm";
import type { Comment } from "@/types/Post";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isUpdating: boolean;
  onDelete: (commentId: string) => Promise<void>;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onReplyAdded: (reply: Comment) => void;
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
  postId,
  isUpdating,
  onDelete,
  onUpdate,
  onReplyAdded,
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  // ❌ REMOVE localContent - use comment.content directly
  // const [localContent, setLocalContent] = useState(comment.content);

  const isAuthor = isAuthenticated && user?.id === comment.user_id;
  const isPending = comment.id?.startsWith("temp-");

  console.log("💬 CommentItem rendering:", {
    commentId: comment.id,
    content: comment.content,
    isPending,
    parentId: comment.parent_id,
    replyCount: comment.replies?.length,
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    console.log("🗑️ Deleting comment:", comment.id);
    setIsDeleting(true);
    await onDelete(comment.id!);
    setIsDeleting(false);
  };

  const handleUpdate = async (content: string) => {
    console.log("✏️ Updating comment:", comment.id, content);
    await onUpdate(comment.id!, content);
    setIsEditing(false);
  };

  const handleReplyAdded = (reply: Comment) => {
    console.log("💬 Reply added to comment:", comment.id, reply);
    onReplyAdded(reply);
    setShowReplyForm(false);
  };

  return (
    <div className={`flex gap-3 ${!comment.parent_id ? "border-b pb-3" : ""}`}>
      {/* Avatar */}
      {comment.avatar_url ? (
        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
          <Image
            src={comment.avatar_url}
            alt={comment.username}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs text-white">
          {comment.username?.[0]?.toUpperCase() || "?"}
        </div>
      )}

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
            initialContent={comment.content} // ✅ Use comment.content directly
            isUpdating={isUpdating}
            onSave={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <p className="mt-1 text-sm text-gray-700">{comment.content}</p> // ✅ Use comment.content directly
        )}

        {/* Reply button - only for top-level comments */}
        {!comment.parent_id && isAuthenticated && !isPending && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="mt-2 text-xs text-gray-500 hover:text-blue-500"
          >
            {showReplyForm ? "Cancel" : "Reply"}
          </button>
        )}

        {showReplyForm && (
          <ReplyForm
            postId={postId}
            parentId={comment.id}
            onReplyAdded={handleReplyAdded}
            onCancel={() => setShowReplyForm(false)}
          />
        )}

        {/* Display replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                isUpdating={isUpdating}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onReplyAdded={onReplyAdded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
