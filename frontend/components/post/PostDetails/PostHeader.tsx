// components/post/PostDetails/PostHeader.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { deletePost } from "@/app/actions/post.actions";
import { memo, useState } from "react";
import { PostAuthor } from "./PostAuthor";
import { Pencil, Trash2 } from "lucide-react";

interface PostHeaderProps {
  postId: string;
  authorId: string;
  username: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export const PostHeader = memo(function PostHeader({
  postId,
  authorId,
  username,
  avatarUrl,
  createdAt,
}: PostHeaderProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = isAuthenticated && authorId === user?.id;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    const result = await deletePost(postId);

    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      console.error("Failed to delete post:", result.error);
    }
    setIsDeleting(false);
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <PostAuthor
        username={username}
        avatarUrl={avatarUrl}
        createdAt={createdAt}
      />

      {isAuthor && (
        <div className="flex gap-2">
          <Link href={`/posts/${postId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
});