import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthState, User } from "@/types/auth";
import { authApi } from "@/lib/api/auth";
import { formatError } from "@/lib/utils/errors";

interface AuthStore extends AuthState {
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  validateAndRefresh: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login({ email, password });

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const formatted = formatError(error);
          set({
            error: formatted.message,
            isLoading: false,
            isAuthenticated: false,
          });
          return { success: false, error: formatted.message };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.register(data);

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const formatted = formatError(error);
          set({
            error: formatted.message,
            isLoading: false,
            isAuthenticated: false,
          });
          return { success: false, error: formatted.message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          console.error("Logout error:", error);
        }
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      validateAndRefresh: async (): Promise<boolean> => {
        try {
          // First, try to validate the current token
          console.log("🔍 Validating token...");
          const validation = await authApi.validateToken();

          if (validation.valid) {
            console.log("✅ Token is valid");
            return true;
          }

          // Token is invalid, try to refresh
          console.log("🔄 Token invalid, attempting refresh...");
          await authApi.refreshToken();

          // After refresh, validate again
          const newValidation = await authApi.validateToken();
          if (newValidation.valid) {
            console.log("✅ Token refreshed and valid");
            return true;
          }

          return false;
        } catch (error: any) {
          // Check if it's a 401 error (expected for expired tokens)
          if (error?.status === 401 || error?.message?.includes("401")) {
            console.log("⚠️ Token validation returned 401 - not authenticated");
            return false;
          }
          // Log other errors but don't throw
          console.error("Validate and refresh error:", error?.message || error);
          return false;
        }
      },

      checkAuth: async (): Promise<boolean> => {
        set({ isLoading: true });

        try {
          // Validate token first
          const isValid = await get().validateAndRefresh();

          if (!isValid) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return false;
          }

          // Token is valid, get user data
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          console.error("Auth check failed:", error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
