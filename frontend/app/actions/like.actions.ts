"use server";

import { revalidatePath } from "next/cache";
import { authenticatedFetchJSON } from "@/lib/server/authenticatedFetch";
import { Post } from "@/types/Post";

interface LikeResponse {
  success: boolean;
  liked?: boolean;
  likeCount?: number;
  error?: string;
}

interface BulkLikesResponse {
  success: boolean;
  likeCounts?: Record<string, number>;
  userLikes?: string[];
  error?: string;
}

/**
 * Like a post
 */
export async function likePost(postId: string): Promise<LikeResponse> {
  try {
    const result = await authenticatedFetchJSON<{
      success: boolean;
      liked: boolean;
      likeCount: number;
    }>(`/likes/${postId}/like`, {
      method: "POST",
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to like post",
      };
    }

    // Revalidate affected paths
    revalidatePath("/");
    revalidatePath(`/posts/${postId}`);
    revalidatePath(`/profile`);

    return {
      success: true,
      liked: result.data.liked,
      likeCount: result.data.likeCount,
    };
  } catch (error) {
    console.error("Like post action error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Unlike a post
 */
export async function unlikePost(postId: string): Promise<LikeResponse> {
  try {
    const result = await authenticatedFetchJSON<{
      success: boolean;
      liked: boolean;
      likeCount: number;
    }>(`/likes/${postId}/like`, {
      method: "DELETE",
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to unlike post",
      };
    }

    // Revalidate affected paths
    revalidatePath("/");
    revalidatePath(`/posts/${postId}`);
    revalidatePath(`/profile`);

    return {
      success: true,
      liked: result.data.liked,
      likeCount: result.data.likeCount,
    };
  } catch (error) {
    console.error("Unlike post action error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get like status for a post (doesn't require authentication)
 */
export async function getLikeStatus(postId: string): Promise<{
  success: boolean;
  hasLiked?: boolean;
  likeCount?: number;
  error?: string;
}> {
  try {
    const result = await authenticatedFetchJSON<{
      hasLiked: boolean;
      likeCount: number;
    }>(`/likes/${postId}/like`, {
      method: "GET",
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to get like status",
      };
    }

    return {
      success: true,
      hasLiked: result.data.hasLiked,
      likeCount: result.data.likeCount,
    };
  } catch (error) {
    console.error("Get like status error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get all posts liked by the current user
 */
export async function getLikedPosts(
  limit: number = 20,
  offset: number = 0,
): Promise<{
  success: boolean;
  posts?: Post[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}> {
  try {
    const result = await authenticatedFetchJSON<{
      success: boolean;
      posts: Post[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>(`/likes/posts?limit=${limit}&offset=${offset}`, {
      method: "GET",
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to get liked posts",
      };
    }

    return {
      success: true,
      posts: result.data.posts,
      pagination: result.data.pagination,
    };
  } catch (error) {
    console.error("Get liked posts error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Bulk check like status for multiple posts
 */
export async function getBulkLikeStatus(postIds: string[]): Promise<{
  success: boolean;
  likeCounts?: Record<string, number>;
  userLikes?: string[];
  error?: string;
}> {
  try {
    const result = await authenticatedFetchJSON<{
      likeCounts: Record<string, number>;
      userLikes: string[];
    }>(`/likes/bulk`, {
      method: "POST",
      body: JSON.stringify({ postIds }),
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to get bulk like status",
      };
    }

    return {
      success: true,
      likeCounts: result.data.likeCounts,
      userLikes: result.data.userLikes,
    };
  } catch (error) {
    console.error("Get bulk like status error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
