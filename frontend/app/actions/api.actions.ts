"use server";

import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from "./auth.actions";

const API_URL = process.env.NEXT_PUBLIC_SERVER_API_URL;

// Authenticated fetch for Server Actions
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const makeRequest = async (token: string) => {
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  let response = await makeRequest(accessToken);

  // If token expired, try to refresh
  if (response.status === 401) {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const { accessToken: newAccessToken } = await refreshResponse.json();
        await setAuthTokens(newAccessToken, refreshToken);
        response = await makeRequest(newAccessToken);
      } else {
        await clearAuthTokens();
        throw new Error("Session expired. Please login again.");
      }
    } else {
      await clearAuthTokens();
      throw new Error("Session expired. Please login again.");
    }
  }

  return response;
}
