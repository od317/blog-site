import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { LikeButton } from "@/components/post/LikeButton";
import { SaveButton } from "@/components/post/SaveButton";

interface SavedPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  username: string;
  avatar_url: string | null;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  created_at: string;
  saved_at: string;
}

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface SavedPostsResponse {
  posts: SavedPost[];
  pagination: PaginationData;
}

// ✅ Server-side data fetching
async function getSavedPosts(
  limit: number = 10,
  offset: number = 0,
): Promise<SavedPostsResponse | null> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${baseUrl}/saves?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        Cookie: cookieString,
      },
      cache: "no-store", // Don't cache saved posts (they change frequently)
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null; // Not authenticated
      }
      throw new Error(`Failed to fetch saved posts: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    return null;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface SavedPostsPageProps {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function SavedPostsPage({
  searchParams,
}: SavedPostsPageProps) {
  const params = await searchParams;
  const page = parseInt(params?.page || "1", 10);
  const limit = parseInt(params?.limit || "10", 10);
  const offset = (page - 1) * limit;

  const data = await getSavedPosts(limit, offset);

  // Handle unauthenticated user
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Card className="p-12 text-center">
            <p className="text-gray-500">
              Please login to view your saved posts.
            </p>
            <Link href="/login">
              <button className="mt-4 text-blue-500 hover:text-blue-600">
                Login
              </button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const { posts, pagination } = data;
  const hasMore = pagination.hasMore;
  const nextPage = page + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Saved Posts</h1>
          <Link href="/">
            <button className="text-sm text-blue-500 hover:text-blue-600">
              ← Back to Feed
            </button>
          </Link>
        </div>

        {posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No saved posts yet.</p>
            <Link href="/">
              <button className="mt-4 text-blue-500 hover:text-blue-600">
                Browse posts to save
              </button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="overflow-hidden p-0">
                  {/* Featured Image */}
                  {post.image_url && (
                    <Link href={`/posts/${post.id}`}>
                      <div className="relative h-48 w-full overflow-hidden bg-gray-100 cursor-pointer">
                        <Image
                          src={post.image_url}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    </Link>
                  )}

                  <div className="p-6">
                    {/* Author info */}
                    <div className="mb-3 flex items-center gap-2">
                      {post.avatar_url ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded-full">
                          <Image
                            src={post.avatar_url}
                            alt={post.username}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-medium text-white">
                          {post.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/profile/${post.username}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {post.username}
                        </Link>
                        <p className="text-xs text-gray-500">
                          Saved {formatDate(post.saved_at)}
                        </p>
                      </div>
                    </div>

                    {/* Title */}
                    <Link href={`/posts/${post.id}`}>
                      <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>

                    {/* Excerpt */}
                    <p className="mt-2 text-gray-600 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Read more */}
                    <Link
                      href={`/posts/${post.id}`}
                      className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Read more →
                    </Link>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-4 pt-3 border-t border-gray-100">
                      <LikeButton
                        postId={post.id}
                        initialLikeCount={post.like_count}
                        initialHasLiked={post.user_has_liked}
                      />
                      <Link href={`/posts/${post.id}#comments`}>
                        <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                          <span>💬</span>
                          <span className="text-sm">{post.comment_count}</span>
                        </button>
                      </Link>
                      <SaveButton postId={post.id} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Load more button (using URL navigation for pagination) */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Link
                  href={`/saved?page=${nextPage}&limit=${limit}`}
                  className="px-4 py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Load more
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
