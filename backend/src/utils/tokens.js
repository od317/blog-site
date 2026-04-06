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
  // Explicitly check for Render environment
  const isRender =
    process.env.RENDER === "true" ||
    process.env.RENDER_EXTERNAL_URL !== undefined;
  const isProduction = process.env.NODE_ENV === "production" || isRender;
  const isSecure = true; // Force secure for Render (HTTPS only)

  console.log("🍪 Setting cookies:", {
    isProduction,
    isSecure,
    environment: process.env.NODE_ENV,
    isRender,
  });

  // Set access token cookie (short-lived)
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // ✅ CHANGED: true for security
    secure: true, // ✅ CHANGED: always true for Render (HTTPS)
    sameSite: "none",
    maxAge: 15 * 60 * 1000,
    path: "/",
    domain: isProduction ? ".onrender.com" : undefined,
  });

  // Set refresh token cookie (long-lived)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // ✅ CHANGED: true for security
    secure: true, // ✅ CHANGED: always true for Render (HTTPS)
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/", // ✅ CHANGED: same path as access token
    domain: isProduction ? ".onrender.com" : undefined,
  });

  // ✅ Add debug response header to verify cookies are being set
  res.setHeader("X-Cookies-Set", "true");
};

const clearTokenCookies = (res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("accessToken", {
    path: "/",
    domain: isProduction ? ".onrender.com" : undefined,
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.clearCookie("refreshToken", {
    path: "/", // ✅ CHANGED: match the path used in set
    domain: isProduction ? ".onrender.com" : undefined,
    httpOnly: true,
    secure: true,
    sameSite: "none",
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
