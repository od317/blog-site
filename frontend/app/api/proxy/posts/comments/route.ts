import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    const body = await request.json();
    const { postId, content, parentId } = body;

    console.log("📡 API Proxy - Adding comment/reply:", { postId, parentId });

    const backendUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${backendUrl}/posts/${postId}/comments`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cookieString) {
      headers["Cookie"] = cookieString;
    }

    const requestBody: { content: string; parentId?: string } = { content };
    if (parentId) {
      requestBody.parentId = parentId;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to add comment" },
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
