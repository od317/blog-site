// app/actions/profile.actions.ts
"use server";

import { User } from "@/types/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

// ============================================
// UPDATE PROFILE (Name, Bio)
// ============================================
interface UpdateProfileInput {
  full_name?: string | null;
  bio?: string | null;
}

interface UpdateProfileResponse {
  success: boolean;
  user?: User;
  error?: string;
}


export async function updateProfile(
  username: string,
  data: UpdateProfileInput,
): Promise<UpdateProfileResponse> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const response = await fetch(`${baseUrl}/profile/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to update profile",
      };
    }

    // Revalidate all profile-related caches
    revalidatePath(`/profile/${username}`);
    revalidatePath(`/${username}`);

    return {
      success: true,
      user: result.user,
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// UPLOAD AVATAR
// ============================================
export async function uploadAvatar(
  username: string,
  formData: FormData,
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const response = await fetch(`${baseUrl}/profile/avatar`, {
      method: "POST",
      headers: {
        Cookie: cookieString,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      // Return specific error message from backend
      return { 
        success: false, 
        error: data.error || data.message || "Failed to upload avatar" 
      };
    }

    revalidatePath(`/${username}`);
    revalidateTag(`profile-${username}`,'max');

    return { success: true, avatarUrl: data.avatarUrl };
  } catch (error) {
    console.error("Upload avatar error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// DELETE AVATAR
// ============================================
export async function deleteAvatar(
  username: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const response = await fetch(`${baseUrl}/profile/avatar`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || "Failed to delete avatar" };
    }

    // Revalidate caches
    revalidatePath(`/${username}`);
    revalidateTag(`profile-${username}`, "max");

    return { success: true };
  } catch (error) {
    console.error("Delete avatar error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ============================================
// TOGGLE FOLLOW
// ============================================
export async function toggleFollow(
  targetUserId: string,
  targetUsername: string,
): Promise<{
  success: boolean;
  isFollowing?: boolean;
  followersCount?: number;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const response = await fetch(`${baseUrl}/follow/${targetUserId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to toggle follow" };
    }

    // Revalidate caches
    revalidatePath(`/${targetUsername}`);
    revalidateTag(`profile-${targetUsername}`, "max");

    return {
      success: true,
      isFollowing: data.isFollowing,
      followersCount: data.followersCount,
    };
  } catch (error) {
    console.error("Toggle follow error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
