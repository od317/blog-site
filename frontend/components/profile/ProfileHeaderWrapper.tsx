import { cookies } from "next/headers";
import { ProfileHeader } from "./ProfileHeader";
import { UserProfile } from "@/types/Profile";

interface ProfileHeaderWrapperProps {
  username: string;
  staticProfile: UserProfile;
}

async function getDynamicProfileData(
  username: string,
): Promise<Partial<UserProfile>> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/profile/${username}`;

    const response = await fetch(url, {
      headers: {
        Cookie: cookieString,
      },
      cache: "no-store", // Don't cache dynamic data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const data = await response.json();

    // Return only the dynamic fields
    return {
      isFollowing: data.isFollowing,
      followers_count: data.followers_count,
      isOwnProfile: data.isOwnProfile,
    };
  } catch (error) {
    console.error("Error fetching dynamic profile data:", error);
    return {
      isFollowing: false,
      followers_count: 0,
      isOwnProfile: false,
    };
  }
}

export default async function ProfileHeaderWrapper({
  username,
  staticProfile,
}: ProfileHeaderWrapperProps) {
  // Fetch dynamic data on the server (has access to cookies)
  const dynamicData = await getDynamicProfileData(username);

  // Merge static and dynamic data
  const fullProfile: UserProfile = {
    ...staticProfile,
    ...dynamicData,
  };

  return <ProfileHeader initialProfile={fullProfile} />;
}
