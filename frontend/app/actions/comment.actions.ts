"use server";

import { revalidatePath } from "next/cache";
import { authenticatedFetchJSON } from "@/lib/server/authenticatedFetch";
import type { Comment } from "@/types/Post";

interface CommentResponse {
  success: boolean;
  comment?: Comment;
  commentCount?: number;
  error?: string;
}

export async function addComment({
  postId,
  content,
}: {
  postId: string;
  content: string;
}): Promise<CommentResponse> {
  try {
    const result = await authenticatedFetchJSON<Comment>(
      `/posts/${postId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to add comment",
      };
    }

    revalidatePath(`/posts/${postId}`);

    return {
      success: true,
      comment: result.data,
    };
  } catch (error) {
    console.error("Add comment action error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deleteComment(
  commentId: string,
  postId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await authenticatedFetchJSON(
      `/posts/comments/${commentId}`,
      {
        method: "DELETE",
      },
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to delete comment",
      };
    }

    revalidatePath(`/posts/${postId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete comment action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateComment({
  commentId,
  postId,
  content,
}: {
  commentId: string;
  postId: string;
  content: string;
}): Promise<CommentResponse> {
  try {
    const result = await authenticatedFetchJSON<Comment>(
      `/posts/comments/${commentId}`,
      {
        method: "PUT",
        body: JSON.stringify({ content }),
      },
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to update comment",
      };
    }

    revalidatePath(`/posts/${postId}`);

    return {
      success: true,
      comment: result.data,
    };
  } catch (error) {
    console.error("Update comment action error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
