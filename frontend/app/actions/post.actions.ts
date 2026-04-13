"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// ============================================
// SERVER ACTION: Create Post
// WHERE: Server-side (Next.js Server Action)
// WHY: Secure, handles authentication, no client API calls
// CACHE: Revalidate affected paths after creation
// ============================================

interface CreatePostInput {
  title: string;
  content: string;
}

interface CreatePostResponse {
  success: boolean;
  post?: {
    id: string;
    title: string;
    content: string;
    user_id: string;
    username: string;
    created_at: string;
  };
  error?: string;
}

interface UpdatePostInput {
  id: string;
  title: string;
  content: string;
}

interface UpdatePostResponse {
  success: boolean;
  post?: {
    id: string;
    title: string;
    content: string;
    updated_at: string;
  };
  error?: string;
}

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  console.log("🔧 Access token present:", !!accessToken);
  return accessToken || null;
}

export async function createPost(
  data: CreatePostInput,
): Promise<CreatePostResponse> {
  console.log("🔧 SERVER ACTION: createPost called");
  console.log("🔧 Data:", data);
  console.log("🔧 NODE_ENV:", process.env.NODE_ENV);
  console.log("🔧 NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);

  try {
    // Validate input
    if (!data.title?.trim()) {
      return { success: false, error: "Title is required" };
    }

    if (!data.content?.trim()) {
      return { success: false, error: "Content is required" };
    }

    // ============================================
    // IMPORTANT: Get cookies and forward them to the API
    // ============================================
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    console.log("🔧 Cookies present:", !!cookieString);
    console.log("🔧 Cookie string length:", cookieString.length);

    // Get API URL from environment
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts`;

    // Make request to backend with cookies
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString, // Forward the cookies!
      },
      body: JSON.stringify({
        title: data.title.trim(),
        content: data.content.trim(),
      }),
    });

    const responseData = await response.json();
    console.log("🔧 Response status:", response.status);
    console.log("🔧 Response data:", responseData);

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || "Failed to create post",
      };
    }

    // Revalidate affected paths
    revalidatePath("/");
    revalidatePath(`/profile/${responseData.username}`);

    return {
      success: true,
      post: responseData,
    };
  } catch (error) {
    console.error("Create post action error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updatePost(data: {
  id: string;
  title: string;
  content: string;
}): Promise<UpdatePostResponse> {
  try {
    if (!data.title?.trim()) {
      return { success: false, error: "Title is required" };
    }

    if (!data.content?.trim()) {
      return { success: false, error: "Content is required" };
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: "Not authenticated. Please login again.",
      };
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts/${data.id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: data.title.trim(),
        content: data.content.trim(),
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || "Failed to update post",
      };
    }

    revalidatePath("/");
    revalidatePath(`/posts/${data.id}`);
    revalidatePath(`/profile`);
    revalidatePath(`/posts/${data.id}/edit`);

    return {
      success: true,
      post: responseData,
    };
  } catch (error) {
    console.error("Update post action error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deletePost(
  postId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: "Not authenticated. Please login again.",
      };
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts/${postId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to delete post",
      };
    }

    revalidatePath("/");
    revalidatePath(`/profile`);

    return { success: true };
  } catch (error) {
    console.error("Delete post action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
