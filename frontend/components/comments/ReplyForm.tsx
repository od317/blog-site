"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { addComment } from "@/app/actions/comment.actions";
import { getSocket } from "@/lib/socket/client";
import type { Comment } from "@/types/Post";

interface ReplyFormProps {
  postId: string;
  parentId: string;
  onReplyAdded: (comment: Comment) => void;
  onCancel: () => void;
}

const generateTempId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export function ReplyForm({
  postId,
  parentId,
  onReplyAdded,
  onCancel,
}: ReplyFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    console.log("💬 ReplyForm submitting:", {
      postId,
      parentId,
      content: content.trim(),
    });

    const tempId = generateTempId();
    const optimisticReply: Comment = {
      id: tempId,
      content: content.trim(),
      post_id: postId,
      user_id: user?.id || "",
      username: user?.username || "You",
      full_name: user?.full_name || null,
      avatar_url: user?.avatar_url || null,
      parent_id: parentId,
      reply_count: 0,
      created_at: new Date().toISOString(),
    };

    console.log("💬 Adding optimistic reply:", optimisticReply);
    onReplyAdded(optimisticReply);
    setContent("");
    onCancel();
    setIsSubmitting(true);

    try {
      const result = await addComment({
        postId,
        content: content.trim(),
        parentId,
      });

      console.log("💬 addComment result:", result);

      if (result.success && result.comment) {
        const realReply = result.comment as Comment;
        console.log("💬 Real reply received:", realReply);
        onReplyAdded(realReply);

        const socket = getSocket();
        if (socket?.connected) {
          console.log("💬 Emitting new-reply event");
          socket.emit("new-reply", { postId, comment: realReply, parentId });
        }
      } else {
        console.error("💬 Failed to add reply:", result.error);
      }
    } catch (error) {
      console.error("💬 Error adding reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 ml-8">
      <textarea
        placeholder="Write a reply..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!isAuthenticated || isSubmitting}
        className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        rows={2}
      />
      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting} size="sm">
          Reply
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
