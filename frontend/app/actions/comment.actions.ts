"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Comment } from "@/types/Post";

// ============================================
// TYPES
// ============================================

interface CommentResponse {
  success: boolean;
  comment?: {
    success: boolean;
    comment: Comment;
    commentCount: number;
  };
  error?: string;
}

interface DeleteCommentResponse {
  success: boolean;
  error?: string;
}

interface UpdateCommentResponse {
  success: boolean;
  comment?: Comment;
  error?: string;
}

// ============================================
// SERVER ACTION: Add Comment
// ============================================

export async function addComment({
  postId,
  content,
}: {
  postId: string;
  content: string;
}): Promise<CommentResponse> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    const baseUrl =
      "http://backend:5000/api";
    const url = `${baseUrl}/posts/${postId}/comments`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
      body: JSON.stringify({ content }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to add comment",
      };
    }

    revalidatePath(`/posts/${postId}`);

    return {
      success: true,
      comment: data,
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

// ============================================
// SERVER ACTION: Delete Comment
// ============================================

export async function deleteComment(
  commentId: string,
  postId: string,
): Promise<DeleteCommentResponse> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    const baseUrl =
      "http://backend:5000/api";
    const url = `${baseUrl}/posts/comments/${commentId}`;

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
        error: errorData.error || "Failed to delete comment",
      };
    }

    revalidatePath(`/posts/${postId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete comment action error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

// ============================================
// SERVER ACTION: Update Comment
// ============================================

export async function updateComment({
  commentId,
  postId,
  content,
}: {
  commentId: string;
  postId: string;
  content: string;
}): Promise<UpdateCommentResponse> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    const baseUrl =
      "http://backend:5000/api";
    const url = `${baseUrl}/posts/comments/${commentId}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
      body: JSON.stringify({ content }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to update comment",
      };
    }

    revalidatePath(`/posts/${postId}`);

    return {
      success: true,
      comment: data,
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
