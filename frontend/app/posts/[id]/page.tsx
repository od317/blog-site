import { notFound } from "next/navigation";
import { PostDetails } from "@/components/post/PostDetails";
import { Post } from "@/types/Post";

// Fetch post data on the server
async function getPost(id: string): Promise<Post | null> {
  try {
    // Build URL
    const baseUrl ="http://backend:5000/api";
    const url = `${baseUrl}/posts/${id}`;

    // Fetch from your backend API
    const response = await fetch(url, {
      cache: "no-store",
    });
    console.log("response", response);
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
  const baseUrl = "http://localhost:5000/api";

  try {
    const response = await fetch(`${baseUrl}/posts?limit=10&offset=0`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const posts = await response.json();

    // Return params for each post
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
  // Await params before accessing id
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

// Main page component
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PostPage({ params }: PageProps) {
  // Await params before accessing id
  const { id } = await params;
  const post = await getPost(id);
  console.log("post details for", post);
  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <PostDetails post={post} />
      </div>
    </div>
  );
}
