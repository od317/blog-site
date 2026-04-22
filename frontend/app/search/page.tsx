import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { LikeButton } from "@/components/post/LikeButton";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";

interface SearchPageProps {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q || "";
  const currentPage = parseInt(params?.page || "1", 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Search Posts</h1>
          <Link href="/">
            <button className="text-sm text-blue-500 hover:text-blue-600">
              ← Back to Feed
            </button>
          </Link>
        </div>

        {/* Search Bar */}
        <SearchBar initialQuery={query} />

        {/* Results */}
        {query ? (
          <Suspense
            fallback={
              <div className="mt-8 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            }
          >
            <SearchResults query={query} page={currentPage} />
          </Suspense>
        ) : (
          <div className="mt-8 rounded-lg bg-white p-12 text-center shadow-sm">
            <p className="text-gray-500">
              Enter a search term to find posts...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
