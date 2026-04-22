// app/saved/page.tsx
import { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { SavedPostsList } from "@/components/saved/SavedPostsList";
import { SavedPostsSkeleton } from "@/components/saved/SavedPostsSkeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Post } from "@/types/Post";

// ============================================
// METADATA
// ============================================
export const metadata: Metadata = {
  title: "Saved Posts | Blog App",
  description: "View your saved posts and bookmarks",
};

// ============================================
// CONSTANTS
// ============================================
const DEFAULT_LIMIT = 10;

// ============================================
// TYPES
// ============================================

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface SavedPostsResponse {
  posts: Post[];
  pagination: PaginationData;
}

// ============================================
// SERVER-SIDE DATA FETCHING
// ============================================
async function getSavedPosts(
  limit: number = DEFAULT_LIMIT,
  offset: number = 0,
): Promise<SavedPostsResponse | null> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    // If no cookies, user is not authenticated
    if (!cookieString) {
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${baseUrl}/saves?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        Cookie: cookieString, // ✅ Use cookie string like the working version
        "Content-Type": "application/json",
      },
      // ✅ Use caching with revalidation for better performance
      next: {
        tags: ["saved-posts"],
        revalidate: 30, // Revalidate every 30 seconds
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null; // Not authenticated
      }
      throw new Error(`Failed to fetch saved posts: ${response.status}`);
    }

    const data = await response.json();

    // Ensure pagination data is complete
    return {
      posts: data.posts || [],
      pagination: {
        total: data.pagination?.total ?? 0,
        limit: data.pagination?.limit ?? limit,
        offset: data.pagination?.offset ?? offset,
        hasMore: data.pagination?.hasMore ?? false,
      },
    };
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    return null;
  }
}

// ============================================
// PAGE PROPS
// ============================================
interface SavedPostsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default async function SavedPostsPage({
  searchParams,
}: SavedPostsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params?.page || "1", 10));
  const limit = Math.min(
    50,
    parseInt(params?.limit || String(DEFAULT_LIMIT), 10),
  );
  const offset = (page - 1) * limit;

  const data = await getSavedPosts(limit, offset);

  // Unauthenticated state
  if (!data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Sign in to view saved posts
          </h2>
          <p className="mt-2 text-gray-500">Save posts to read them later</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { posts, pagination } = data;
  const hasMore = pagination.hasMore;
  const nextPage = page + 1;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Saved Posts</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pagination.total} {pagination.total === 1 ? "post" : "posts"} saved
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            ← Back to Feed
          </Button>
        </Link>
      </div>

      {/* Posts List with Suspense */}
      <Suspense fallback={<SavedPostsSkeleton />}>
        {posts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 h-16 w-16 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No saved posts yet
            </h3>
            <p className="mt-2 text-gray-500">
              Start saving posts you want to read later
            </p>
            <Link href="/">
              <Button className="mt-4">Browse Posts</Button>
            </Link>
          </Card>
        ) : (
          <>
            <SavedPostsList
              initialPosts={posts}
              initialPagination={pagination}
            />

            {/* Load more button */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Link
                  href={`/saved?page=${nextPage}&limit=${limit}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  Load More
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </>
        )}
      </Suspense>
    </div>
  );
}
