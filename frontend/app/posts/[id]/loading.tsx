// app/posts/[id]/loading.tsx
import { PostSkeleton } from "@/components/post/PostSkeleton";

export default function loading() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PostSkeleton />
      </div>
    </div>
  );
}