"use client";

import { ReactNode, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

interface AuthProviderProps {
  children: ReactNode;
}

const PROTECTED_ROUTES = ["/profile", "/settings", "/dashboard"];
const PUBLIC_ONLY_ROUTES = ["/login", "/register"];

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  const hasCheckedRef = useRef(false);
  const isRedirectingRef = useRef(false);

  const requiresAuth = PROTECTED_ROUTES.some((route) =>
    pathname?.startsWith(route),
  );
  const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.includes(pathname || "");

  // Silent auth check - happens in background
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    checkAuth();
  }, [checkAuth]);

  // Handle redirects
  useEffect(() => {
    if (isRedirectingRef.current) return;

    // Redirect authenticated users away from login/register
    if (isAuthenticated && isPublicOnlyRoute) {
      isRedirectingRef.current = true;
      const returnUrl = new URLSearchParams(window.location.search).get(
        "returnUrl",
      );
      router.replace(returnUrl || "/");
      return;
    }

    // Redirect unauthenticated users away from protected routes
    if (!isAuthenticated && requiresAuth) {
      isRedirectingRef.current = true;
      const returnUrl = encodeURIComponent(pathname || "");
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }
  }, [isAuthenticated, requiresAuth, isPublicOnlyRoute, pathname, router]);

  // Reset redirect flag on pathname change
  useEffect(() => {
    isRedirectingRef.current = false;
  }, [pathname]);

  // No loading state - public pages render immediately
  return <>{children}</>;
}
