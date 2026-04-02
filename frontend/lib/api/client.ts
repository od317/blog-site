import { ApiError } from "@/types/auth";
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
}

export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30 seconds

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

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log("sendding", data);
    const response = await this.fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithTimeout(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();
