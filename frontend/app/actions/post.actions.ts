"use server";

import { revalidatePath } from "next/cache";
import { authenticatedFetchJSON } from "@/lib/server/authenticatedFetch";

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

    const result = await authenticatedFetchJSON<CreatePostResponse["post"]>(
      "/posts",
      {
        method: "POST",
        body: JSON.stringify({
          title: data.title.trim(),
          content: data.content.trim(),
        }),
      },
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to create post",
      };
    }

    // Revalidate affected paths
    revalidatePath("/");
    revalidatePath(`/profile/${result.data.username}`);
    revalidatePath("/posts");

    return {
      success: true,
      post: result.data,
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

    const result = await authenticatedFetchJSON<UpdatePostResponse["post"]>(
      `/posts/${data.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: data.title.trim(),
          content: data.content.trim(),
        }),
      },
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to update post",
      };
    }

    revalidatePath("/");
    revalidatePath(`/posts/${data.id}`);
    revalidatePath(`/profile`);
    revalidatePath(`/posts/${data.id}/edit`);

    return {
      success: true,
      post: result.data,
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
    const result = await authenticatedFetchJSON(`/posts/${postId}`, {
      method: "DELETE",
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to delete post",
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
