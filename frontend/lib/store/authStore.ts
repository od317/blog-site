import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthState } from "@/types/auth";
import { authApi } from "@/lib/api/auth";
import { formatError } from "@/lib/utils/errors";
import { getErrorMessage, isApiError } from "@/types/error";
import { setAuthTokens, clearAuthTokens } from "@/app/actions/auth.actions";

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

          // Store tokens in HttpOnly cookies via Server Action
          if (response.accessToken && response.refreshToken) {
            await setAuthTokens(response.accessToken, response.refreshToken);
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error: unknown) {
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

          // Store tokens in HttpOnly cookies via Server Action
          if (response.accessToken && response.refreshToken) {
            await setAuthTokens(response.accessToken, response.refreshToken);
          }

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error: unknown) {
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
        } catch (error: unknown) {
          console.error("Logout error:", getErrorMessage(error));
        }
        // Clear HttpOnly cookies
        await clearAuthTokens();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      validateAndRefresh: async (): Promise<boolean> => {
        try {
          console.log("🔍 Validating token...");
          const validation = await authApi.validateToken();
          console.log(validation);
          if (validation.valid) {
            console.log("✅ Token is valid");
            return true;
          }

          console.log("🔄 Token invalid, attempting refresh...");
          const refreshResponse = await authApi.refreshToken();

          if (refreshResponse.success && refreshResponse.accessToken) {
            // Update the token in HttpOnly cookie
            // Note: refresh token stays the same
            await setAuthTokens(
              refreshResponse.accessToken,
              refreshResponse.refreshToken || "",
            );
            console.log("✅ Token refreshed and valid");
            return true;
          }

          return false;
        } catch (error: unknown) {
          const isUnauthorized =
            (isApiError(error) && error.status === 401) ||
            getErrorMessage(error).includes("401");

          if (isUnauthorized) {
            console.log("⚠️ Token validation returned 401 - not authenticated");
            return false;
          }

          console.error("Validate and refresh error:", getErrorMessage(error));
          return false;
        }
      },

      checkAuth: async (): Promise<boolean> => {
        set({ isLoading: true });

        try {
          const isValid = await get().validateAndRefresh();

          if (!isValid) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return false;
          }

          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error: unknown) {
          console.error("Auth check failed:", getErrorMessage(error));
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
