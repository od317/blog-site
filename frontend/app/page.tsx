// app/page.tsx (Server Component)
import { Suspense } from "react";
import { CreatePostFAB } from "@/components/post/CreatePostFAB";
import { SortSelector } from "@/components/ui/SortSelector";
import type { Metadata } from "next";
import { PostFeedWrapper } from "@/components/post/PostFeedWrapper";
import PostListSkeleton from "@/components/post/PostListSkeleton";
import { Post } from "@/types/Post";

export const metadata: Metadata = {
  title: "Home | Blog App",
  description: "Discover the latest posts from our community",
};

interface HomePageProps {
  searchParams: Promise<{ sort?: string }>; // Fixed type
}

async function getInitialPosts(sort: string): Promise<Post[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${baseUrl}/posts?sort=${sort}&limit=10&offset=0`;

    const response = await fetch(url, {
      cache: "no-store", // Don't cache, we want fresh data
    });

    if (!response.ok) {
      console.error(`Failed to fetch posts: ${response.status}`);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching initial posts:", error);
    return [];
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const sort = sp.sort || "latest";

  // Fetch initial posts on the server
  const initialPosts = await getInitialPosts(sort);
  console.log("initial posts on server are", initialPosts);
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Sort */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            {sort === "latest"
              ? "Latest Posts"
              : sort === "popular"
                ? "Popular Posts"
                : "Posts"}
          </span>
        </h1>

        <SortSelector currentSort={sort} />
      </div>

      {/* Posts Feed with Suspense */}
      <Suspense fallback={<PostListSkeleton />}>
        <PostFeedWrapper initialSort={sort} initialPosts={initialPosts} />
      </Suspense>

      {/* FAB for Create Post */}
      <CreatePostFAB />
    </div>
  );
}
