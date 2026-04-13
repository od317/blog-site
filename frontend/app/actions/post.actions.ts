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

export async function createPost(
  data: CreatePostInput,
): Promise<CreatePostResponse> {
  try {
    // Validate input
    if (!data.title?.trim()) {
      return { success: false, error: "Title is required" };
    }

    if (!data.content?.trim()) {
      return { success: false, error: "Content is required" };
    }

    // Get cookies for authentication
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    // Get API URL from environment
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts`;

    // Make request to backend
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
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
        error: responseData.error || "Failed to create post",
      };
    }

    // ============================================
    // REVALIDATION STRATEGY
    // Revalidate affected paths to show new content
    // ============================================
    revalidatePath("/"); // Homepage feed
    revalidatePath(`/profile/${responseData.username}`); // User's profile
    revalidatePath("/posts"); // Posts list (if exists)

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

export async function updatePost(
  data: UpdatePostInput,
): Promise<UpdatePostResponse> {
  try {
    // Validate input
    if (!data.title?.trim()) {
      return { success: false, error: "Title is required" };
    }

    if (!data.content?.trim()) {
      return { success: false, error: "Content is required" };
    }

    // Get cookies for authentication
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    // Get API URL from environment
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts/${data.id}`;

    // Make request to backend
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
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

    // ============================================
    // REVALIDATION STRATEGY
    // Revalidate affected paths to show updated content
    // ============================================
    revalidatePath("/"); // Homepage feed
    revalidatePath(`/posts/${data.id}`); // Current post page
    revalidatePath(`/profile`); // Profile page
    revalidatePath(`/posts/${data.id}/edit`); // Edit page

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

// ============================================
// SERVER ACTION: Delete Post
// ============================================

export async function deletePost(
  postId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts/${postId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Cookie: cookieString,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to delete post",
      };
    }

    // ============================================
    // REVALIDATION STRATEGY
    // Revalidate affected paths after deletion
    // ============================================
    revalidatePath("/"); // Homepage feed
    revalidatePath(`/profile`); // Profile page

    return { success: true };
  } catch (error) {
    console.error("Delete post action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
