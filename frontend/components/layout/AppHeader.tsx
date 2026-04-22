// components/layout/AppHeader.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/Button";

export function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-bold text-gray-900">
            Blog App
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* Search */}
                <Link
                  href="/search"
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Search"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </Link>

                {/* Saved Posts */}
                <Link
                  href="/saved"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  Saved
                </Link>

                {/* Notifications */}
                <NotificationBell />

                {/* User Menu */}
                <div className="flex items-center gap-3 border-l pl-4">
                  <span className="text-sm text-gray-600">
                    {user?.username}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => logout()}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/search">
                  <Button size="sm">Search</Button>
                </Link>
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
          </nav>
        </div>
      </div>
    </header>
  );
}
