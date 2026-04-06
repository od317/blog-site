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
  // Detect if we're on Render
  const isRender =
    process.env.RENDER === "true" ||
    process.env.RENDER_EXTERNAL_URL !== undefined ||
    process.env.RENDER_GIT_COMMIT !== undefined;

  const isProduction = process.env.NODE_ENV === "production" || isRender;

  // CRITICAL: Different cookie settings for Render vs local
  const cookieSettings = isRender
    ? {
        // For Render - no domain specified
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        // DON'T set domain for Render - let browser handle it
      }
    : {
        // For localhost
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      };

  console.log("🍪 Setting cookies with config:", {
    isRender,
    cookieSettings,
    frontendUrl: process.env.FRONTEND_URL,
  });

  // Set access token cookie
  res.cookie("accessToken", accessToken, {
    ...cookieSettings,
    maxAge: 15 * 60 * 1000,
  });

  // Set refresh token cookie
  res.cookie("refreshToken", refreshToken, {
    ...cookieSettings,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

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
