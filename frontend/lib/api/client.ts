import { config } from "../config";
import {
  getAccessToken,
  setAuthTokens,
  clearAuthTokens,
  getRefreshToken as getRefreshTokenAction,
} from "@/app/actions/auth.actions";

export class ApiErrorClass extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(message: string = "Request timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  skipRefresh?: boolean;
  requiresAuth?: boolean; // Whether this request needs authentication
}

export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.baseUrl = config.apiUrl;
    console.log("🔧 API Client initialized with baseUrl:", this.baseUrl);
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError();
      }
      if (error instanceof Error && error.message === "Failed to fetch") {
        throw new NetworkError(
          "Unable to connect to server. Please check your internet connection.",
        );
      }
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiErrorClass(response.status, "Invalid response from server");
    }

    if (!response.ok) {
      const errorMessage =
        data.error ||
        data.message ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiErrorClass(response.status, errorMessage, data);
    }

    return data as T;
  }

  // Refresh token method - sends refresh token in request body
  private async refreshToken(): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
  }> {
    try {
      // Get refresh token from HttpOnly cookie via Server Action
      const refreshToken = await getRefreshTokenAction();

      if (!refreshToken) {
        return { success: false };
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.accessToken) {
        // Update tokens in HttpOnly cookies
        await setAuthTokens(
          data.accessToken,
          data.refreshToken || refreshToken,
        );
        return { success: true, accessToken: data.accessToken };
      }

      return { success: false };
    } catch (error) {
      console.error("Refresh token failed:", error);
      return { success: false };
    }
  }

  // Queue requests while refreshing
  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private async attemptRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(() => resolve(true));
      });
    }

    this.isRefreshing = true;

    try {
      const result = await this.refreshToken();
      if (result.success && result.accessToken) {
        this.onRefreshed(result.accessToken);
      }
      return result.success;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Get auth token for request header
  private async getAuthToken(): Promise<string | null> {
    const token = await getAccessToken();
    return token ?? null; // Convert undefined to null
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {},
    retryCount: number = 0,
  ): Promise<T> {
    const maxRetries = 1;
    const url = `${this.baseUrl}${endpoint}`;

    // Skip refresh for auth endpoints
    const isAuthEndpoint =
      endpoint.includes("/auth/login") ||
      endpoint.includes("/auth/register") ||
      endpoint.includes("/auth/verify") ||
      endpoint.includes("/auth/resend-verification");

    // Add Authorization header if needed
    const requiresAuth = options.requiresAuth !== false && !isAuthEndpoint;
    let authToken: string | null = null;

    if (requiresAuth) {
      authToken = await this.getAuthToken();
    }

    try {
      // Build headers properly
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add custom headers from options
      if (options.headers) {
        const customHeaders = options.headers as Record<string, string>;
        Object.assign(headers, customHeaders);
      }

      if (requiresAuth && authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await this.fetchWithTimeout(url, {
        ...options,
        headers,
      });

      // If 401 and we haven't retried yet, try to refresh token
      if (
        response.status === 401 &&
        retryCount < maxRetries &&
        !options.skipRefresh &&
        !isAuthEndpoint &&
        requiresAuth
      ) {
        console.log("🔄 Token expired, attempting refresh...");

        const refreshed = await this.attemptRefresh();

        if (refreshed) {
          console.log("✅ Token refreshed, retrying request...");
          return this.request(endpoint, options, retryCount + 1);
        } else {
          console.log("❌ Refresh failed, redirecting to login...");
          await clearAuthTokens();
          throw new ApiErrorClass(401, "Session expired. Please login again.");
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
      ...options,
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<T> {
    console.log("Sending post data:", data);
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      ...options,
    });
  }
}

export const api = new ApiClient();
