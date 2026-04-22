// components/post/PostDetails/PostActions.tsx
"use client";

import { memo } from "react";
import { PostLikeStatus } from "./PostLikeStatus";
import { SaveButton } from "./SaveButton";

interface PostActionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
}

export const PostActions = memo(function PostActions({
  postId,
  likeCount,
  commentCount,
}: PostActionsProps) {
  return (
    <div className="mt-6 flex items-center gap-6 border-t pt-4">
      <PostLikeStatus postId={postId} initialLikeCount={likeCount} />

      <div className="flex items-center gap-2 text-gray-500">
        <span className="text-xl">💬</span>
        <span className="text-sm font-medium">{commentCount}</span>
      </div>

      <SaveButton postId={postId} />
    </div>
  );
});
