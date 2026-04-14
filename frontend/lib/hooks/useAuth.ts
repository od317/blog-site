import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

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
    withAuth,
  };
}
