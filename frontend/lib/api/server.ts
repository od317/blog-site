import { cookies } from "next/headers";

interface FetchOptions {
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  tags?: string[];
}

export async function serverFetch<T>(
  endpoint: string,
  options?: FetchOptions,
): Promise<T> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const url = `${baseUrl}${endpoint}`;

  const cookieStore = cookies();
  const cookieString = cookieStore.toString();

  const response = await fetch(url, {
    headers: {
      Cookie: cookieString,
      "Content-Type": "application/json",
    },
    cache: options?.cache || "no-store",
    next: options?.next,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
  }

  return response.json();
}
