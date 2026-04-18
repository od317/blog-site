import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfilePosts } from "@/components/profile/ProfilePosts";
import { ProfilePageProps, UserProfile } from "@/types/Profile";

// ============================================
// DATA FETCHING - SERVER SIDE (Fixed - same pattern as post page)
// ============================================
async function getProfile(username: string): Promise<UserProfile | null> {
  try {
    // Build URL
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/profile/${username}`;

    // Fetch from backend API with cookies (same as post page)
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 Profile data received:", {
      username: data.username,
      isFollowing: data.isFollowing,
    });

    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

// ============================================
// METADATA - SEO OPTIMIZATION
// ============================================
export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    return {
      title: "User Not Found",
      description: "The requested user profile could not be found.",
    };
  }

  return {
    title: `${profile.full_name || profile.username} | Blog App`,
    description: profile.bio || `Read posts by ${profile.username} on Blog App`,
    openGraph: {
      title: `${profile.full_name || profile.username}`,
      description: profile.bio || `Posts by ${profile.username}`,
      type: "profile",
    },
  };
}

// ============================================
// GENERATE STATIC PARAMS
// ============================================
export async function generateStaticParams() {
  return [];
}

// ============================================
// SKELETON COMPONENTS
// ============================================
function ProfileHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mx-auto h-32 w-32 rounded-full bg-gray-200" />
      <div className="mx-auto mt-4 h-6 w-48 rounded bg-gray-200" />
      <div className="mx-auto mt-2 h-4 w-64 rounded bg-gray-200" />
    </div>
  );
}

function ProfilePostsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-40 rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Suspense fallback={<ProfileHeaderSkeleton />}>
          <ProfileHeader initialProfile={profile} />
        </Suspense>

        <div className="mt-8">
          <Suspense fallback={<ProfilePostsSkeleton />}>
            <ProfilePosts username={username} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
