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
  const isProduction = process.env.NODE_ENV === "production";
  const isSecure = isProduction; // Only secure in production

  // Set access token cookie (short-lived)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "none", // Important for cross-domain cookies
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
    domain: isProduction ? ".onrender.com" : undefined, // Allow subdomains
  });

  // Set refresh token cookie (long-lived)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "none", // Important for cross-domain cookies
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth/refresh",
    domain: isProduction ? ".onrender.com" : undefined, // Allow subdomains
  });
};

const clearTokenCookies = (res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("accessToken", {
    path: "/",
    domain: isProduction ? ".onrender.com" : undefined,
  });
  res.clearCookie("refreshToken", {
    path: "/api/auth/refresh",
    domain: isProduction ? ".onrender.com" : undefined,
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
};
