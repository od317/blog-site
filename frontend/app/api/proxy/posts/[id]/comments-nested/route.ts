import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  console.log("🚀 PROXY ROUTE HIT - Timestamp:", new Date().toISOString());

  try {
    const { id } = await params;
    console.log("🚀 Post Id:", id);

    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    const backendUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${backendUrl}/posts/${id}/comments/nested`;
    console.log("🚀 Backend URL:", url);

    const headers: Record<string, string> = {};
    if (cookieString) {
      headers["Cookie"] = cookieString;
    }

    // ✅ Disable caching completely
    const response = await fetch(url, {
      headers,
      cache: "no-store", // Don't cache
      next: { revalidate: 0 }, // Force revalidate
    });

    console.log("🚀 Response status:", response.status);

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch comments" },
        { status: response.status },
      );
    }

    // ✅ Also prevent caching in the response
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("API Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
