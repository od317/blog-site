import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthState, User } from "@/types/auth";
import { authApi } from "@/lib/api/auth";
import { formatError } from "@/lib/utils/errors";

interface AuthStore extends AuthState {
  token: string | null;
  refreshToken: string | null;
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
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login({ email, password });

          set({
            user: response.user,
            token: response.accessToken,
            refreshToken: response.refreshToken,
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
            token: response.accessToken,
            refreshToken: response.refreshToken,
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
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.verifyEmail(token);

          set((state) => ({
            user: state.user
              ? { ...state.user, is_verified: true }
              : response.user,
            isLoading: false,
          }));

          return { success: true };
        } catch (error) {
          const formatted = formatError(error);
          set({ error: formatted.message, isLoading: false });
          return { success: false, error: formatted.message };
        }
      },

      checkAuth: async () => {
        const { token, isAuthenticated } = get();

        if (!token || !isAuthenticated) {
          return;
        }

        set({ isLoading: true });

        try {
          const user = await authApi.getMe(token);
          set({ user, isLoading: false });
        } catch (error) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
