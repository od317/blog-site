"use server";

import { revalidatePath } from "next/cache";
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from "./auth.actions";

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

const API_URL = "http://backend:5000/api";

// Helper for authenticated requests
async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const makeRequest = async (token: string) => {
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  let response = await makeRequest(accessToken);

  // If token expired, try to refresh
  if (response.status === 401) {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const { accessToken: newAccessToken } = await refreshResponse.json();
        await setAuthTokens(newAccessToken, refreshToken);
        response = await makeRequest(newAccessToken);
      } else {
        await clearAuthTokens();
        throw new Error("Session expired. Please login again.");
      }
    } else {
      await clearAuthTokens();
      throw new Error("Session expired. Please login again.");
    }
  }

  return response;
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

    const response = await authenticatedFetch("/posts", {
      method: "POST",
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

    // Revalidate affected paths
    revalidatePath("/");
    revalidatePath(`/profile/${responseData.username}`);
    revalidatePath("/posts");

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
    if (!data.title?.trim()) {
      return { success: false, error: "Title is required" };
    }

    if (!data.content?.trim()) {
      return { success: false, error: "Content is required" };
    }

    const response = await authenticatedFetch(`/posts/${data.id}`, {
      method: "PUT",
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
    const response = await authenticatedFetch(`/posts/${postId}`, {
      method: "DELETE",
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
