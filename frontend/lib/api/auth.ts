import { api } from "./client";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from "@/types/auth";

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/auth/register", data);
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/auth/login", credentials);
  },

  verifyEmail: async (
    token: string,
  ): Promise<{ message: string; user: User }> => {
    return api.get(`/auth/verify/${token}`);
  },

  getMe: async (token: string): Promise<User> => {
    return api.get<User>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
