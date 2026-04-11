export interface ApiErrorResponse {
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}
