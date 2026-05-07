import { PostSkeleton } from "@/components/post/PostSkeleton";
import React from "react";

const loading = () => {
  <div className="space-y-4">
    <PostSkeleton />
    <PostSkeleton />
    <PostSkeleton />
  </div>;
};

export default loading;
