// components/post/PostDetails/PostActions.tsx
"use client";

import { memo } from "react";
import { PostLikeStatus } from "./PostLikeStatus";
import { SaveButton } from "./SaveButton";

interface PostActionsProps {
  postId: string;
  likeCount: number;
}

export const PostActions = memo(function PostActions({
  postId,
  likeCount,
}: PostActionsProps) {
  return (
    <div className="mt-6 flex items-center gap-6 border-t border-primary-500/10 pt-4">
      <PostLikeStatus postId={postId} initialLikeCount={likeCount} />


      <SaveButton postId={postId} />
    </div>
  );
});