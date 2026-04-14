"use client";

import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface AuthProviderProps {
  children: React.ReactNode;
  skipAuthCheck?: boolean;
}

// Public routes that don't need auth check
const PUBLIC_ROUTES = ["/login", "/register", "/verify-email"];

export function AuthProvider({
  children,
  skipAuthCheck = false,
}: AuthProviderProps) {
  const { checkAuth } = useAuthStore();
  const pathname = usePathname();
  const hasCheckedRef = useRef(false);

  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname?.startsWith(route),
  );

  useEffect(() => {
    // Skip if already checked or skipAuthCheck is true or route is public
    if (hasCheckedRef.current || skipAuthCheck || isPublicRoute) {
      return;
    }

    hasCheckedRef.current = true;

    // Run check in background without blocking
    checkAuth().catch(() => {
      // Silently fail - user is not authenticated
    });
  }, []); // Empty dependency array - runs only once on mount!

  return <>{children}</>;
}
