"use server";

import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from "@/app/actions/auth.actions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";

interface FetchOptions extends RequestInit {
  skipRefresh?: boolean;
}

/**
 * Authenticated fetch for server actions
 * Automatically handles token refresh on 401
 */
export async function authenticatedFetch(
  endpoint: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { skipRefresh = false, ...fetchOptions } = options;
  const url = `${API_URL}${endpoint}`;

  // Helper to make the actual request
  const makeRequest = async (token: string) => {
    return fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...fetchOptions.headers,
      },
    });
  };

  // Get current access token
  const accessToken = await getAccessToken();

  if (!accessToken && !skipRefresh) {
    throw new Error("No access token found");
  }

  // Make initial request
  const response = await makeRequest(accessToken!);
  console.log(response);
  // If not unauthorized or skipRefresh is true, return response
  if (response.status !== 401 || skipRefresh) {
    return response;
  }

  console.log("🔄 Access token expired, attempting refresh...");

  // Try to refresh the token
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    console.log("❌ No refresh token found");
    await clearAuthTokens();
    throw new Error("Session expired. Please login again.");
  }

  // Call refresh endpoint
  const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!refreshResponse.ok) {
    console.log("❌ Refresh failed");
    await clearAuthTokens();
    throw new Error("Session expired. Please login again.");
  }

  const refreshData = await refreshResponse.json();
  console.log("refresh response", refreshData);

  if (!refreshData.success || !refreshData.accessToken) {
    console.log("❌ Invalid refresh response");
    await clearAuthTokens();
    throw new Error("Session expired. Please login again.");
  }

  console.log("✅ Token refreshed successfully");

  // Store new tokens
  await setAuthTokens(refreshData.accessToken, refreshData.refreshToken);

  // Retry the original request with new token
  const retryResponse = await makeRequest(refreshData.accessToken);

  return retryResponse;
}

/**
 * Helper to parse JSON response and handle errors
 */
export async function authenticatedFetchJSON<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await authenticatedFetch(endpoint, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Authenticated fetch error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
