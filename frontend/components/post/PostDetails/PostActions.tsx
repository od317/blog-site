// components/post/PostDetails/PostActions.tsx
"use client";

import { PostLikeStatus } from "./PostLikeStatus";
import { SaveButton } from "./SaveButton";

interface PostActionsProps {
  postId: string;
  likeCount: number;
}

// Remove memo to allow re-renders when likeCount changes
export function PostActions({ postId, likeCount }: PostActionsProps) {
  return (
    <div className="mt-6 flex items-center gap-6 border-t border-primary-500/10 pt-4">
      <PostLikeStatus postId={postId} initialLikeCount={likeCount} />
      <SaveButton postId={postId} />
    </div>
  );
}
