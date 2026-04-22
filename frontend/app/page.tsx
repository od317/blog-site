"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { CreatePostForm } from "@/components/post/CreatePostForm";
import { PostList } from "@/components/post/PostList";
import { SortSelector } from "@/components/ui/SortSelector";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "latest";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Blog App</h1>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.username}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => logout()}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {isAuthenticated ? (
          <>
            <CreatePostForm />
            <div className="mb-4 flex justify-end">
              <SortSelector currentSort={currentSort} />
            </div>
            <PostList key={currentSort} />
          </>
        ) : (
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold">Welcome to Blog App</h2>
            <p className="mt-2 text-gray-600">
              Sign in to create posts and interact with the community.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Sign Up</Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
