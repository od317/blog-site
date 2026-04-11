import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const RequireAuth = (redirectTo: string = "/login") => {
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      }
    }, [isLoading, isAuthenticated, router, redirectTo]);
  };

  const RequireGuest = (redirectTo: string = "/") => {
    useEffect(() => {
      if (!isLoading && isAuthenticated) {
        router.push(redirectTo);
      }
    }, [isLoading, isAuthenticated, router, redirectTo]);
  };

  // Add action guard for protected actions
  const withAuth = useCallback(
    <T extends (...args: any[]) => any>(
      action: T,
      redirectTo: string = "/login",
    ): ((...args: Parameters<T>) => void) => {
      return (...args: Parameters<T>) => {
        if (isLoading) return;

        if (!isAuthenticated) {
          router.push(
            `${redirectTo}?returnUrl=${encodeURIComponent(window.location.pathname)}`,
          );
          return;
        }

        return action(...args);
      };
    },
    [isAuthenticated, isLoading, router],
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearError,
    RequireAuth,
    RequireGuest,
    withAuth, // Add this
  };
}
