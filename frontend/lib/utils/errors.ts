import { ApiErrorClass, NetworkError, TimeoutError } from "@/lib/api/client";

export type ErrorType =
  | "validation"
  | "auth"
  | "network"
  | "timeout"
  | "unknown";

export interface FormattedError {
  message: string;
  type: ErrorType;
  fieldErrors?: Record<string, string[]>;
  status?: number;
}

export function formatError(error: unknown): FormattedError {
  // Handle API errors
  if (error instanceof ApiErrorClass) {
    // Handle validation errors from backend
    if (error.data?.errors && Array.isArray(error.data.errors)) {
      const fieldErrors: Record<string, string[]> = {};
      error.data.errors.forEach((err: { msg: string; param?: string }) => {
        const field = err.param || "general";
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.msg);
      });

      return {
        message: "Please fix the validation errors below.",
        type: "validation",
        fieldErrors,
        status: error.status,
      };
    }

    // Handle specific HTTP status codes
    if (error.status === 401) {
      return {
        message: error.message || "Invalid email or password.",
        type: "auth",
        status: error.status,
      };
    }

    if (error.status === 403) {
      return {
        message:
          error.message || "You do not have permission to perform this action.",
        type: "auth",
        status: error.status,
      };
    }

    if (error.status === 404) {
      return {
        message: error.message || "The requested resource was not found.",
        type: "unknown",
        status: error.status,
      };
    }

    if (error.status === 500) {
      return {
        message: "Server error. Please try again later.",
        type: "unknown",
        status: error.status,
      };
    }

    return {
      message: error.message,
      type: "unknown",
      status: error.status,
    };
  }

  // Handle network errors
  if (error instanceof NetworkError) {
    return {
      message: error.message,
      type: "network",
    };
  }

  // Handle timeout errors
  if (error instanceof TimeoutError) {
    return {
      message:
        "Request took too long. Please check your connection and try again.",
      type: "timeout",
    };
  }

  // Handle unknown errors
  if (error instanceof Error) {
    return {
      message: error.message,
      type: "unknown",
    };
  }

  return {
    message: "An unexpected error occurred. Please try again.",
    type: "unknown",
  };
}
