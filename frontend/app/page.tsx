"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { CreatePostForm } from "@/components/post/CreatePostForm";
import { PostList } from "@/components/post/PostList";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Real-time Blog</h1>
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
            <PostList />
          </>
        ) : (
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold">Welcome to Real-time Blog</h2>
            <p className="mt-2 text-gray-600">
              Sign in to create posts and see real-time updates from other
              users.
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
