// ============================================
// CACHING STRATEGY: ISR (Incremental Static Regeneration)
// WHERE: Server-side (Next.js)
// WHY: Profile data changes infrequently, but we want it fresh
// REVALIDATION: 60 seconds - balance between freshness and performance
// ============================================

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfilePosts } from "@/components/profile/ProfilePosts";
import { ProfilePageProps, UserProfile } from "@/types/Profile";

// ============================================
// DATA FETCHING - SERVER SIDE
// CACHE: force-cache (default for fetch)
// REVALIDATION: 60 seconds (ISR)
// ============================================
async function getProfile(username: string): Promise<UserProfile | null> {
  try {
    const baseUrl = 
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/profile/${username}`;

    // Next.js automatically caches this fetch
    // revalidate: 60 means it will be regenerated every 60 seconds
    const response = await fetch(url, {
      next: {
        revalidate: 60, // ISR: regenerate every 60 seconds
      },
      headers: {
        Cookie: await getCookieString(), // Pass cookies for auth
      },
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

// Helper to get cookies for server-side requests
async function getCookieString(): Promise<string> {
  const cookieStore = await import("next/headers").then((mod) => mod.cookies());
  return cookieStore.toString();
}

// ============================================
// METADATA - SEO OPTIMIZATION
// GENERATION: Server-side per request
// CACHE: ISR (same as page)
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
// GENERATE STATIC PARAMS (Optional)
// For popular users - pre-render at build time
// CACHE: Build-time static generation
// ============================================
export async function generateStaticParams() {
  // Optional: Pre-render most popular users
  // For now, return empty array - rely on ISR
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
// RENDERING: Server Component (ISR)
// CACHE: Revalidated every 60 seconds
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
        {/* Profile Header - Static, server-rendered */}
        <Suspense fallback={<ProfileHeaderSkeleton />}>
          <ProfileHeader initialProfile={profile} />
        </Suspense>

        {/* Posts Section - Client component with pagination */}
        <div className="mt-8">
          <Suspense fallback={<ProfilePostsSkeleton />}>
            <ProfilePosts username={username} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
