// app/posts/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Post } from "@/types/Post";
import { EditPostForm } from "@/components/post/EditPostForm";

async function getPostWithAuth(id: string): Promise<Post | null> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${baseUrl}/posts/${id}`;

    const response = await fetch(url, {
      headers: {
        Cookie: cookieString,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch post: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching post for edit:", error);
    return null;
  }
}

// Helper to get current user ID from session
async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        Cookie: cookieString,
      },
      cache: "no-store",
    });
    
    if (!response.ok) return null;
    const userData = await response.json();
    return userData.id;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  
  // Fetch both in parallel
  const [post, currentUserId] = await Promise.all([
    getPostWithAuth(id),
    getCurrentUserId(),
  ]);
  
  if (!post) {
    notFound();
  }
  
  // Check if user is authorized
  if (currentUserId !== post.user_id) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />
        <EditPostForm post={post} />
      </div>
    </div>
  );
}