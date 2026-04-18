import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProfileHeaderWrapper from "@/components/profile/ProfileHeaderWrapper";
import { ProfilePosts } from "@/components/profile/ProfilePosts";
import { ProfilePageProps, UserProfile } from "@/types/Profile";

// ============================================
// STATIC DATA FETCHING (no cookies, for SSG)
// ============================================
async function getStaticProfile(username: string): Promise<UserProfile | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/profile/${username}`;

    // No cookies - static data only
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const data = await response.json();

    // Return only static fields (remove user-specific data)
    return {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      posts_count: data.posts_count,
      following_count: data.following_count,
      total_likes_received: data.total_likes_received,
      created_at: data.created_at,
      // Static defaults for user-specific fields
      followers_count: data.followers_count, // Will be updated by wrapper
      isFollowing: false,
      isOwnProfile: false,
    };
  } catch (error) {
    console.error("Error fetching static profile:", error);
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
  const profile = await getStaticProfile(username);

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
  // Pre-generate popular profiles here
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
// MAIN PAGE COMPONENT (SSG)
// ============================================
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const staticProfile = await getStaticProfile(username);

  if (!staticProfile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Suspense fallback={<ProfileHeaderSkeleton />}>
          <ProfileHeaderWrapper
            username={username}
            staticProfile={staticProfile}
          />
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
