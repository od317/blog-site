"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { Search, Bookmark } from "lucide-react";
import { NavbarSkeleton } from "./NavbarSkeleton";

export function AppHeader() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  if (isLoading) return <NavbarSkeleton />;

  return (
    <header className="sticky top-0 z-50 border-b border-primary-500/20 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent hover:from-primary-300 hover:to-accent-300 transition-all"
          >
            Blog App
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link
                  href="/search"
                  className="rounded-lg p-2 text-muted-foreground hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </Link>

                <Link
                  href="/saved"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-accent-400 hover:bg-accent-500/10 transition-all"
                >
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden sm:inline">Saved</span>
                </Link>

                <NotificationBell />

                {/* User Avatar and Profile Link */}
                <Link
                  href={`/${user?.username}`}
                  className="flex items-center gap-3 border-l border-primary-500/20 pl-4 ml-2 group"
                >
                  {/* Avatar */}
                  <div className="relative h-8 w-8 mr-2 overflow-hidden rounded-full ring-2 ring-primary-500/20 group-hover:ring-primary-400/40 transition-all">
                    {user?.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.username || "User avatar"}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-medium text-white">
                        {user?.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-primary-500/30 px-3 py-1.5 text-sm font-medium text-primary-400 hover:bg-primary-500/10 hover:border-primary-400/50 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/search"
                  className="rounded-lg p-2 text-muted-foreground hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                >
                  <Search className="h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-primary-500/30 px-4 py-1.5 text-sm font-medium text-primary-400 hover:bg-primary-500/10 hover:border-primary-400/50 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
