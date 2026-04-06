"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { useCallback } from "react";

interface UseRequireAuthOptions {
  redirectTo?: string;
  showToast?: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { redirectTo = "/login", showToast = true } = options;

  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (isLoading) return false;

      if (!isAuthenticated) {
        if (showToast) {
          // You can add a toast notification here later
          console.log("Authentication required");
        }

        // Store the current path to redirect back after login
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`${redirectTo}?returnUrl=${returnUrl}`);
        return false;
      }

      callback?.();
      return true;
    },
    [isAuthenticated, isLoading, router, redirectTo, showToast],
  );

  return { requireAuth, isAuthenticated, isLoading };
}
