const jwt = require("jsonwebtoken");

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isRender =
    process.env.RENDER === "true" || process.env.RENDER_EXTERNAL_URL;
  const isProduction = process.env.NODE_ENV === "production" || isRender;

  // Common cookie settings for both tokens
  const baseSettings = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "none",
    domain: '.onrender.com'
  };

  // Access token cookie - available everywhere
  res.cookie("accessToken", accessToken, {
    ...baseSettings,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  });

  // Refresh token cookie - also available everywhere (not just /refresh)
  // This ensures it can be read by the refresh endpoint
  res.cookie("refreshToken", refreshToken, {
    ...baseSettings,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/", // Changed from "/api/auth/refresh" to "/"
  });

  console.log("🍪 Cookies set with paths:", {
    accessTokenPath: "/",
    refreshTokenPath: "/",
    isProduction,
  });
};

const clearTokenCookies = (res) => {
  const isRender =
    process.env.RENDER === "true" || process.env.RENDER_EXTERNAL_URL;
  const isProduction = process.env.NODE_ENV === "production" || isRender;

  const baseSettings = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "none",
    domain: ".onrender.com",
  };

  // Clear access token
  res.clearCookie("accessToken", {
    ...baseSettings,
    path: "/",
  });

  // Clear refresh token - use same path as when set
  res.clearCookie("refreshToken", {
    ...baseSettings,
    path: "/",
  });

  console.log("🍪 Cookies cleared");
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
};
