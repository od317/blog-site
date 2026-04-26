// components/comments/CommentItem.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { CommentEditForm } from "./CommentEditForm";
import { ReplyForm } from "./ReplyForm";
import { Pencil, Trash2, Reply, MessageSquare } from "lucide-react";
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
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
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

  const handleReplyAdded = (reply: Comment) => {
    onReplyAdded(reply);
    setShowReplyForm(false);
  };

  return (
    <div className={`flex gap-3 ${!comment.parent_id ? "border-b border-primary-500/10 pb-4" : ""}`}>
      {/* Avatar */}
      {comment.avatar_url ? (
        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-primary-500/20">
          <Image
            src={comment.avatar_url}
            alt={comment.username}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs text-white ring-1 ring-primary-500/20">
          {comment.username?.[0]?.toUpperCase() || "?"}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-foreground text-sm truncate">
              {comment.username || "User"}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {isPending ? "Sending..." : formatDate(comment.created_at)}
            </span>
          </div>
          
          {isAuthor && !isPending && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                disabled={isUpdating || isDeleting}
                className="text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isUpdating || isDeleting}
                className="text-xs text-accent-400 hover:text-accent-300 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
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
          <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed">
            {comment.content}
          </p>
        )}

        {/* Reply button - only for top-level comments */}
        {!comment.parent_id && isAuthenticated && !isPending && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="mt-2 text-xs text-muted-foreground hover:text-primary-400 transition-colors flex items-center gap-1"
          >
            <Reply className="h-3 w-3" />
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
          <div className="mt-3 space-y-3 border-l-2 border-primary-500/10 pl-4">
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