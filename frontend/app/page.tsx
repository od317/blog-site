// app/page.tsx (Server Component)
import { Suspense } from "react";
import { CreatePostFAB } from "@/components/post/CreatePostFAB";
import { SortSelector } from "@/components/ui/SortSelector";
import type { Metadata } from "next";
import { PostFeedWrapper } from "@/components/post/PostFeedWrapper";
import PostListSkeleton from "@/components/post/PostListSkeleton";

export const metadata: Metadata = {
  title: "Home | Blog App",
  description: "Discover the latest posts from our community",
};

interface HomePageProps {
  searchParams: { sort?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const sort = searchParams.sort || "latest";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Sort */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {sort === "latest"
            ? "Latest Posts"
            : sort === "popular"
              ? "Popular Posts"
              : "Posts"}
        </h1>

        <SortSelector currentSort={sort} />
      </div>

      {/* Posts Feed with Suspense */}
      <Suspense fallback={<PostListSkeleton />}>
        <PostFeedWrapper initialSort={sort} />
      </Suspense>

      {/* FAB for Create Post */}
      <CreatePostFAB />
    </div>
  );
}
