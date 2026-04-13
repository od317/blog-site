import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();

    // Get cookies from the request (browser sends them automatically)
    const cookieHeader = request.headers.get("cookie");

    console.log("📡 Cookies present:", !!cookieHeader);

    if (!cookieHeader || !cookieHeader.includes("accessToken")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${backendUrl}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader, // Forward the cookies
      },
      body: JSON.stringify({ title, content }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to create post" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
