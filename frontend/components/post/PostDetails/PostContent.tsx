// components/post/PostDetails/PostContent.tsx
"use client";

import { memo } from "react";

interface PostContentProps {
  title: string;
  content: string;
}

export const PostContent = memo(function PostContent({
  title,
  content,
}: PostContentProps) {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      <div className="prose max-w-none">
        <p className="whitespace-pre-wrap text-gray-700">{content}</p>
      </div>
    </>
  );
});
