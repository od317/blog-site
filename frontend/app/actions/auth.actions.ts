"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setAuthTokens(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "none",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });

  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  console.log("✅ Auth tokens stored in HttpOnly cookies");
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  return token ?? null; // Return null instead of undefined
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("refreshToken")?.value;
  return token ?? null; // Return null instead of undefined
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
