/**
 * Get a cookie value by name
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

/**
 * Check if a cookie exists
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

/**
 * Get all auth tokens
 */
export const getAuthTokens = () => {
  return {
    accessToken: getCookie("accessToken"),
    refreshToken: getCookie("refreshToken"),
  };
};

/**
 * Check if user has any auth tokens
 */
export const hasAuthTokens = (): boolean => {
  return hasCookie("accessToken") || hasCookie("refreshToken");
};
