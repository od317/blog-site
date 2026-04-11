// Custom error types
export interface ApiError {
  status: number;
  message: string;
  data?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  errors?: ValidationError[];
  statusCode?: number;
}

// Type guard to check if error is ApiError
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error
  );
}

// Type guard for Axios-like errors
export function isAxiosError(
  error: unknown,
): error is { response?: { data?: unknown; status?: number } } {
  return typeof error === "object" && error !== null && "response" in error;
}

// Generic error handler
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;

  if (isApiError(error)) return error.message;

  if (isAxiosError(error) && error.response?.data) {
    const data = error.response.data as ApiErrorResponse;
    return data.error || data.message || "An error occurred";
  }

  if (error instanceof Error) return error.message;

  return "An unexpected error occurred";
}
