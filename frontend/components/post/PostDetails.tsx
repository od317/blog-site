"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePostStore } from "@/lib/store/postStore";
import { LikeButton } from "@/components/post/LikeButton";
import { Button } from "@/components/ui/Button";
import { ActiveReaders } from "./ActiveReaders";
import { deletePost } from "@/app/actions/post.actions";
import { getSocket } from "@/lib/socket/client";
import type { Post, Comment } from "@/types/Post";
import { CommentSection } from "../comments/CommentSection";

interface PostDetailsProps {
  post: Post;
}

export function PostDetails({ post: initialPost }: PostDetailsProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { updateLikeCount, updateCommentCount, updatePostInList } =
    usePostStore();
  const [post, setPost] = useState<Post>(initialPost);
  const [comments, setComments] = useState<Comment[]>(
    initialPost.comments || [],
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = isAuthenticated && post.user_id === user?.id;

  // Listen for real-time post updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handlePostUpdate = (updatedPost: Post) => {
      if (updatedPost.id === post.id) {
        setPost(updatedPost);
        updatePostInList(updatedPost);
      }
    };

    socket.on("post-updated", handlePostUpdate);

    return () => {
      socket.off("post-updated", handlePostUpdate);
    };
  }, [post.id, updatePostInList]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    const result = await deletePost(post.id);

    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      console.error("Failed to delete post:", result.error);
    }
    setIsDeleting(false);
  };

  const handleCommentAdded = (newComment: Comment) => {
    setComments((prev) => {
      // Check if this is replacing a temp comment
      const existingTempIndex = prev.findIndex(
        (c) => c.id?.startsWith("temp-") && c.content === newComment.content,
      );

      if (existingTempIndex !== -1) {
        const updated = [...prev];
        updated[existingTempIndex] = newComment;
        return updated;
      }
      return [newComment, ...prev];
    });

    setPost((prev) => ({
      ...prev,
      comment_count: prev.comment_count + 1,
    }));
    updateCommentCount(post.id);
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments((prev) =>
      prev.map((c) => (c.id === updatedComment.id ? updatedComment : c)),
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setPost((prev) => ({
      ...prev,
      comment_count: prev.comment_count - 1,
    }));
  };

  const formatDate = (dateString: string) => {
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
  };

  return (
    <div>
      <Link href="/">
        <Button variant="outline" className="mb-4">
          ← Back to Feed
        </Button>
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {/* Active Readers Counter */}
        <ActiveReaders postId={post.id} />

        {/* Author info */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
              {post.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{post.username}</p>
              <p className="text-xs text-gray-500" suppressHydrationWarning>
                {formatDate(post.created_at)}
              </p>
            </div>
          </div>

          {isAuthor && (
            <div className="flex gap-2">
              <Link href={`/posts/${post.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        <h1 className="mb-4 text-2xl font-bold">{post.title}</h1>

        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap text-gray-700">{post.content}</p>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t pt-4">
          <LikeButton
            postId={post.id}
            initialLikeCount={post.like_count}
            initialHasLiked={post.user_has_liked}
          />
          <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500">
            <span>💬</span>
            <span className="text-sm">{post.comment_count}</span>
          </button>
        </div>
      </div>

      <CommentSection
        postId={post.id}
        comments={comments}
        onCommentAdded={handleCommentAdded}
        onCommentDeleted={handleCommentDeleted}
        onCommentUpdated={handleCommentUpdated}
      />
    </div>
  );
}
