"use client";

import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useRef } from "react";

interface AuthProviderProps {
  children: React.ReactNode;
  skipAuthCheck?: boolean;
}

export function AuthProvider({
  children,
  skipAuthCheck = false,
}: AuthProviderProps) {
  const { checkAuth } = useAuthStore();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Skip if already checked or skipAuthCheck is true
    if (hasCheckedRef.current || skipAuthCheck) {
      return;
    }

    // Quick check for cookies
    const hasAnyToken =
      document.cookie.includes("accessToken") ||
      document.cookie.includes("refreshToken");

    if (!hasAnyToken) {
      console.log("🔍 No tokens found, skipping auth validation");
      hasCheckedRef.current = true;
      return;
    }

    hasCheckedRef.current = true;

    // Run check in background without blocking
    checkAuth().catch(() => {
      // Silently fail - user is not authenticated
    });
  }, [checkAuth, skipAuthCheck]);

  return <>{children}</>;
}
