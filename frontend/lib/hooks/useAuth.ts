import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
  }, []);

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
  };
}
