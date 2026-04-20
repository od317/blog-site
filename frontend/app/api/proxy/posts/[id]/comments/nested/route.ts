import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    console.log("📡 Fetching nested comments for post:", id);

    const backendUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${backendUrl}/posts/${id}/comments/nested`;

    const headers: Record<string, string> = {};
    if (cookieString) {
      headers["Cookie"] = cookieString;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch comments" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
