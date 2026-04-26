// app/search/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { ArrowLeft, Search } from "lucide-react";

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
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Search Posts
          </h1>
          <Link
            href="/"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
        </div>

        {/* Search Bar */}
        <SearchBar initialQuery={query} />

        {/* Results */}
        {query ? (
          <Suspense
            fallback={
              <div className="mt-8 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            }
          >
            <SearchResults query={query} page={currentPage} />
          </Suspense>
        ) : (
          <div className="mt-8 rounded-xl border border-primary-500/10 bg-card p-12 text-center">
            <Search className="h-12 w-12 text-primary-400 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Enter a search term to find posts...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}