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
import { Bookmark, ArrowLeft, ChevronDown } from "lucide-react";

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

    if (!cookieString) {
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${baseUrl}/saves?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        Cookie: cookieString,
        "Content-Type": "application/json",
      },
      next: {
        tags: ["saved-posts"],
        revalidate: 30,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(`Failed to fetch saved posts: ${response.status}`);
    }

    const data = await response.json();

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
        <Card className="p-12 text-center border-primary-500/10">
          <div className="mx-auto mb-6 flex justify-center">
            <div className="rounded-full border-2 border-primary-500/30 p-4">
              <Bookmark className="h-16 w-16 text-primary-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Sign in to view saved posts
          </h2>
          <p className="mt-2 text-muted-foreground">
            Save posts to read them later
          </p>
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Saved Posts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="text-primary-400 font-medium">{pagination.total}</span>{" "}
            {pagination.total === 1 ? "post" : "posts"} saved
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Feed
          </Button>
        </Link>
      </div>

      {/* Posts List with Suspense */}
      <Suspense fallback={<SavedPostsSkeleton />}>
        {posts.length === 0 ? (
          <Card className="p-12 text-center border-primary-500/10">
            <div className="mx-auto mb-6 flex justify-center">
              <div className="rounded-full border-2 border-primary-500/30 p-4">
                <Bookmark className="h-16 w-16 text-primary-400 opacity-50" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              No saved posts yet
            </h3>
            <p className="mt-2 text-muted-foreground">
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
                  className="inline-flex items-center gap-2 rounded-lg border border-primary-500/20 bg-card px-4 py-2 text-sm font-medium text-primary-400 hover:bg-primary-500/10 hover:border-primary-400/50 transition-all"
                >
                  Load More
                  <ChevronDown className="h-4 w-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </Suspense>
    </div>
  );
}