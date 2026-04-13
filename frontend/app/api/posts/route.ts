import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;
    console.log(request.headers);
    // Get cookies from the incoming request
    const cookieString = request.headers.get("cookie") || "";

    console.log("📡 API Route - Cookies received:", cookieString);
    console.log(
      "📡 API Route - Has accessToken:",
      cookieString.includes("accessToken"),
    );

    // If no cookies, return unauthorized
    if (!cookieString || !cookieString.includes("accessToken")) {
      console.log("📡 No access token found in cookies");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts`;

    console.log("📡 Forwarding to backend:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString, // Forward all cookies
      },
      body: JSON.stringify({ title, content }),
    });

    const data = await response.json();
    console.log("📡 Backend response status:", response.status);

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
