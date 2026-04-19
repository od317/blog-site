"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setAuthTokens(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  const isRender = process.env.RENDER === "true" || process.env.RENDER_EXTERNAL_URL;
  
  // For cross-subdomain cookies on Render
  const isCrossOrigin = isRender;
  
  console.log("🍪 Setting cookies with config:", {
    isProduction,
    isRender,
    isCrossOrigin,
  });

  // Access Token (short-lived)
  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,        // ✅ Must be true with SameSite=None
    sameSite: isCrossOrigin ? "none" : "lax",  // ✅ "none" for cross-origin
    maxAge: 15 * 60,             // 15 minutes
    path: "/",
  });

  // Refresh Token (long-lived)
  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,        // ✅ Must be true with SameSite=None
    sameSite: isCrossOrigin ? "none" : "lax",  // ✅ "none" for cross-origin
    maxAge: 7 * 24 * 60 * 60,    // 7 days
    path: "/",
  });

  console.log("✅ Auth tokens stored in HttpOnly cookies");
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  return token ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("refreshToken")?.value;
  return token ?? null;
}

export async function clearAuthTokens() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  console.log("✅ Auth tokens cleared");
}

export async function logout() {
  await clearAuthTokens();
  redirect("/login");
}