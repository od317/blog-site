"use server";

import { revalidatePath } from "next/cache";
import { authenticatedFetchJSON } from "@/lib/server/authenticatedFetch";

interface FollowResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface FollowStatusResponse {
  success: boolean;
  isFollowing?: boolean;
  followersCount?: number;
  error?: string;
}

/**
 * Follow a user
 */
export async function followUser(userId: string): Promise<FollowResponse> {
  try {
    const result = await authenticatedFetchJSON(`/profile/${userId}/follow`, {
      method: "POST",
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to follow user",
      };
    }

    // Revalidate profile page
    revalidatePath(`/profile`);

    return {
      success: true,
      message: "Successfully followed user",
    };
  } catch (error) {
    console.error("Follow user action error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(userId: string): Promise<FollowResponse> {
  try {
    const result = await authenticatedFetchJSON(`/profile/${userId}/follow`, {
      method: "DELETE",
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Failed to unfollow user",
      };
    }

    // Revalidate profile page
    revalidatePath(`/profile`);

    return {
      success: true,
      message: "Successfully unfollowed user",
    };
  } catch (error) {
    console.error("Unfollow user action error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Get follow status for a user
 */
export async function getFollowStatus(
  userId: string,
): Promise<FollowStatusResponse> {
  try {
    // This endpoint might need to be created
    const result = await authenticatedFetchJSON<{
      isFollowing: boolean;
      followersCount: number;
    }>(`/profile/${userId}/follow-status`, {
      method: "GET",
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || "Failed to get follow status",
      };
    }

    return {
      success: true,
      isFollowing: result.data.isFollowing,
      followersCount: result.data.followersCount,
    };
  } catch (error) {
    console.error("Get follow status error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
