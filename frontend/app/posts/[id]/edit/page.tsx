// ============================================
// CACHING STRATEGY: Dynamic (no cache)
// WHERE: Server-side
// WHY: Edit page needs fresh data, shouldn't be cached
// ============================================

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Post } from "@/types/Post";
import { EditPostForm } from "@/components/post/EditPostForm";

// Fetch post data for editing
async function getPost(id: string): Promise<Post | null> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    const baseUrl =
      process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${baseUrl}/posts/${id}`;

    const response = await fetch(url, {
      headers: {
        Cookie: cookieString,
      },
      cache: "no-store", // Don't cache edit page data
    });
    console.log(response);
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

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const post = await getPost(id);
  console.log(post);
  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <EditPostForm post={post} />
      </div>
    </div>
  );
}
