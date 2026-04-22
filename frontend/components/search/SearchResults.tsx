import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { LikeButton } from "@/components/post/LikeButton";

interface SearchResultPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  readingTime: string;
  created_at: string;
}

interface SearchResponse {
  posts: SearchResultPost[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  query: string;
}

async function searchPosts(
  query: string,
  page: number,
  limit: number = 10,
): Promise<SearchResponse | null> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    const offset = (page - 1) * limit;

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${baseUrl}/posts/search?q=${encodeURIComponent(
      query,
    )}&limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        Cookie: cookieString,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to search: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Search error:", error);
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

interface SearchResultsProps {
  query: string;
  page: number;
  limit?: number;
}

export async function SearchResults({
  query,
  page,
  limit = 10,
}: SearchResultsProps) {
  const data = await searchPosts(query, page, limit);

  if (!data || data.posts.length === 0) {
    return (
      <div className="mt-8 rounded-lg bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500">No results found for {query}</p>
        <p className="mt-2 text-sm text-gray-400">
          Try different keywords or browse the feed
        </p>
      </div>
    );
  }

  const { posts, pagination } = data;
  const nextPage = page + 1;
  const prevPage = page - 1;

  return (
    <div className="mt-8">
      {/* Results count */}
      <p className="mb-4 text-sm text-gray-500">
        Found {pagination.total} result{pagination.total !== 1 ? "s" : ""} for
        {query}
      </p>

      {/* Results list */}
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
                    {post.full_name || post.username}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {formatDate(post.created_at)} · {post.readingTime}
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
              <p className="mt-2 text-gray-600 line-clamp-3">{post.excerpt}</p>

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
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex justify-center gap-4">
        {prevPage >= 1 && (
          <Link
            href={`/search?q=${encodeURIComponent(query)}&page=${prevPage}`}
            className="px-4 py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            ← Previous
          </Link>
        )}
        <span className="px-4 py-2 text-sm text-gray-500">
          Page {page} of {Math.ceil(pagination.total / limit)}
        </span>
        {pagination.hasMore && (
          <Link
            href={`/search?q=${encodeURIComponent(query)}&page=${nextPage}`}
            className="px-4 py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
