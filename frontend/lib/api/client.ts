import { config } from "../config";

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
  skipRefresh?: boolean; // Prevent refresh loops
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
        credentials: "include",
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

  // Refresh token method
  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return response.ok;
    } catch (error) {
      console.error("Refresh token failed:", error);
      return false;
    }
  }

  // Queue requests while refreshing
  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private async attemptRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      // Wait for the ongoing refresh
      return new Promise((resolve) => {
        this.refreshSubscribers.push(() => resolve(true));
      });
    }

    this.isRefreshing = true;

    try {
      const success = await this.refreshToken();
      if (success) {
        this.onRefreshed("");
      }
      return success;
    } finally {
      this.isRefreshing = false;
    }
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

    try {
      const response = await this.fetchWithTimeout(url, options);

      // If 401 and we haven't retried yet, try to refresh token
      // Skip for auth endpoints
      if (
        response.status === 401 &&
        retryCount < maxRetries &&
        !options.skipRefresh &&
        !isAuthEndpoint // Don't try to refresh for auth endpoints
      ) {
        console.log("🔄 Token expired, attempting refresh...");

        const refreshed = await this.attemptRefresh();

        if (refreshed) {
          console.log("✅ Token refreshed, retrying request...");
          return this.request(endpoint, options, retryCount + 1);
        } else {
          console.log("❌ Refresh failed, redirecting to login...");
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
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
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
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
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
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
  }
}

export const api = new ApiClient();
