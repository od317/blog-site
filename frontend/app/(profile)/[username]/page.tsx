// app/(profile)/[username]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfilePosts } from "@/components/profile/ProfilePosts";
import { ProfilePageProps, UserProfile } from "@/types/Profile";
import { PostsResponse } from "@/types/Post";

// ============================================
// FORCE DYNAMIC RENDERING
// ============================================
export const dynamic = 'force-dynamic';

// ============================================
// CONSTANTS
// ============================================
const POSTS_PER_PAGE = 10;

// ============================================
// SERVER-SIDE DATA FETCHING
// ============================================
async function getProfile(username: string): Promise<UserProfile | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${baseUrl}/profile/${username}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Don't cache dynamic profile data
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

async function getProfilePosts(
  username: string,
  offset: number = 0,
  limit: number = POSTS_PER_PAGE,
): Promise<PostsResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${baseUrl}/profile/${username}/posts?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching profile posts:", error);
    return {
      posts: [],
      pagination: { hasMore: false, total: 0, offset: 0, limit: 20 },
    };
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

  const displayName = profile.full_name || profile.username;

  return {
    title: `${displayName} (@${profile.username}) | Blog App`,
    description: profile.bio || `Read posts by ${profile.username} on Blog App`,
    openGraph: {
      title: displayName,
      description: profile.bio || `Posts by ${profile.username}`,
      type: "profile",
      ...(profile.avatar_url && {
        images: [{ url: profile.avatar_url }],
      }),
    },
  };
}

// ============================================
// SKELETON COMPONENTS
// ============================================
function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-xl border border-primary-500/10 bg-card p-6">
      <div className="flex flex-col items-center animate-pulse">
        <div className="h-32 w-32 rounded-full bg-primary-500/10 ring-4 ring-primary-500/10" />
        <div className="mt-4 h-6 w-48 rounded bg-primary-500/10" />
        <div className="mt-2 h-4 w-32 rounded bg-primary-500/10" />
        <div className="mt-4 flex gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-6 w-12 rounded bg-primary-500/10" />
              <div className="mt-1 h-3 w-8 rounded bg-primary-500/10" />
            </div>
          ))}
        </div>
        <div className="mt-4 h-9 w-24 rounded bg-primary-500/10" />
      </div>
    </div>
  );
}

function ProfilePostsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-primary-500/10 bg-card p-6 animate-pulse"
        >
          <div className="h-56 w-full rounded-lg bg-primary-500/10" />
          <div className="mt-4 h-6 w-3/4 rounded bg-primary-500/10" />
          <div className="mt-2 h-4 w-1/4 rounded bg-primary-500/10" />
          <div className="mt-3 h-16 w-full rounded bg-primary-500/10" />
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

  const [profile, initialPostsData] = await Promise.all([
    getProfile(username),
    getProfilePosts(username, 0, POSTS_PER_PAGE),
  ]);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen relative">
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />
      
      <div className="mx-auto max-w-4xl px-4 py-8 relative z-10">
        <Suspense fallback={<ProfileHeaderSkeleton />}>
          <ProfileHeader initialProfile={profile} />
        </Suspense>

        <div className="mt-8">
          <Suspense fallback={<ProfilePostsSkeleton />}>
            <ProfilePosts username={username} initialData={initialPostsData} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}