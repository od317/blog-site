"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

interface SaveResponse {
  success: boolean;
  saved?: boolean;
  savedCount?: number;
  error?: string;
}

// Save a post
export async function savePost(postId: string): Promise<SaveResponse> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    if (!cookieString) {
      return { success: false, error: "Not authenticated" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const response = await fetch(`${baseUrl}/saves/${postId}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to save post",
      };
    }

    // ✅ Add the second argument 'page' to revalidate the page
    revalidateTag("saved-posts", "max");

    return {
      success: true,
      saved: true,
      savedCount: data.savedCount,
    };
  } catch (error) {
    console.error("Save post error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Unsave a post
export async function unsavePost(postId: string): Promise<SaveResponse> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    if (!cookieString) {
      return { success: false, error: "Not authenticated" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const response = await fetch(`${baseUrl}/saves/${postId}/save`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to unsave post",
      };
    }

    // ✅ Add the second argument 'page' to revalidate the page
    revalidateTag("saved-posts", "max");

    return {
      success: true,
      saved: false,
      savedCount: data.savedCount,
    };
  } catch (error) {
    console.error("Unsave post error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Check if post is saved
export async function getSaveStatus(postId: string): Promise<{
  success: boolean;
  hasSaved?: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const response = await fetch(`${baseUrl}/saves/${postId}/save`, {
      headers: {
        Cookie: cookieString,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { success: false, error: "Failed to get save status" };
    }

    const data = await response.json();
    return { success: true, hasSaved: data.hasSaved };
  } catch (error) {
    console.error("Get save status error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
