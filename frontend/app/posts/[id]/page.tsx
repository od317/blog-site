// app/posts/[id]/page.tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Post } from "@/types/Post";
import { PostDetails } from "@/components/post/PostDetails/PostDetails";

async function getPost(id: string): Promise<Post | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${baseUrl}/posts/${id}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch post: ${response.status}`);
    }

    const post = await response.json();
    return post;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export async function generateStaticParams() {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;

  try {
    const response = await fetch(`${baseUrl}/posts?limit=10&offset=0`);
    if (!response.ok) return [];
    const posts = await response.json();
    return posts.map((post: Post) => ({ id: post.id }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export const revalidate = 60;

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

function PostDetailsSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-32 rounded-lg bg-primary-500/10" />
          <div className="rounded-xl border border-primary-500/10 bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-500/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-primary-500/10" />
                <div className="h-3 w-24 rounded bg-primary-500/10" />
              </div>
            </div>
            <div className="h-8 w-3/4 rounded bg-primary-500/10" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full rounded bg-primary-500/10" />
              <div className="h-4 w-5/6 rounded bg-primary-500/10" />
              <div className="h-4 w-4/6 rounded bg-primary-500/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <PostDetails post={post} />
        </div>
      </div>
    </Suspense>
  );
}