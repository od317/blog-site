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

export interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

export const authApi = {
  /**
   * Register a new user
   * @param data - User registration data
   * @returns AuthResponse with user data and tokens in response body
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/auth/register", data);
  },

  /**
   * Login user
   * @param credentials - Email and password
   * @returns AuthResponse with user data and tokens in response body
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/auth/login", credentials);
  },

  /**
   * Logout user - clears refresh token from database
   * Note: Frontend should also clear its own HttpOnly cookies
   */
  logout: async (): Promise<{ message: string }> => {
    return api.post<{ message: string }>("/auth/logout");
  },

  /**
   * Get current user info (requires valid access token in Authorization header)
   * The API client will automatically add the token from HttpOnly cookie
   */
  getMe: async (): Promise<User> => {
    return api.get<User>("/auth/me");
  },

  /**
   * Refresh access token using refresh token
   * @returns New access token (and optionally new refresh token)
   */
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    return api.post<RefreshTokenResponse>("/auth/refresh");
  },

  /**
   * Validate current access token
   * Returns { valid: true, user: {...} } if token is valid
   * Returns 401 if token is invalid or expired
   */
  validateToken: async (): Promise<ValidateTokenResponse> => {
    console.log("validating token");
    return api.get<ValidateTokenResponse>("/auth/validate");
  },
};
