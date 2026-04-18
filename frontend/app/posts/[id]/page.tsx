import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostDetails } from "@/components/post/PostDetails";
import { Post } from "@/types/Post";

// Fetch post data on the server (public data only)
async function getPost(id: string): Promise<Post | null> {
  try {
    const baseUrl =
      
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts/${id}`;

    // No cookies needed - only public data
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch post: ${response.status}`);
    }

    const post = await response.json();
    return post;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

// Generate static params for popular posts (ISR)
export async function generateStaticParams() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  try {
    const response = await fetch(`${baseUrl}/posts?limit=10&offset=0`);

    if (!response.ok) {
      return [];
    }

    const posts = await response.json();
    return posts.map((post: Post) => ({
      id: post.id,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// Revalidate posts every 60 seconds (ISR)
export const revalidate = 60;

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested post could not be found.",
    };
  }

  return {
    title: `${post.title} | Blog App`,
    description: post.content.slice(0, 160),
    openGraph: {
      title: post.title,
      description: post.content.slice(0, 160),
      type: "article",
      publishedTime: post.created_at,
      authors: [post.username],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.content.slice(0, 160),
    },
  };
}

// Loading component for Suspense
function PostDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-10 w-32 rounded bg-gray-200" />
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="mt-1 h-3 w-24 rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-5/6 rounded bg-gray-200" />
              <div className="h-4 w-4/6 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <Suspense fallback={<PostDetailsSkeleton />}>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <PostDetails post={post} />
        </div>
      </div>
    </Suspense>
  );
}
