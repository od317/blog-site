import { api } from "./client";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from "@/types/auth";

export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    is_verified: boolean;
  };
  error?: string;
}

export const authApi = {
  /**
   * Register a new user
   * @param data - User registration data
   * @returns AuthResponse with user data (tokens are set as cookies)
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/auth/register", data);
  },

  /**
   * Login user
   * @param credentials - Email and password
   * @returns AuthResponse with user data (tokens are set as cookies)
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/auth/login", credentials);
  },

  /**
   * Logout user - clears refresh token from database and cookies
   */
  logout: async (): Promise<{ message: string }> => {
    return api.post<{ message: string }>("/auth/logout");
  },

  /**
   * Verify email with token
   * @param token - Email verification token from URL
   */
  verifyEmail: async (
    token: string,
  ): Promise<{ message: string; user: User }> => {
    return api.get(`/auth/verify/${token}`);
  },

  /**
   * Get current user info (requires valid access token cookie)
   */
  getMe: async (): Promise<User> => {
    return api.get<User>("/auth/me");
  },

  /**
   * Refresh access token using refresh token cookie
   * This is called automatically by the API client when receiving 401
   */
  refreshToken: async (): Promise<{ message: string }> => {
    return api.post<{ message: string }>("/auth/refresh");
  },

  /**
   * Validate current access token
   * Returns { valid: true, user: {...} } if token is valid
   * Returns 401 if token is invalid or expired
   */
  validateToken: async (): Promise<ValidateTokenResponse> => {
    return api.get<ValidateTokenResponse>("/auth/validate");
  },
};
