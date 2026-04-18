import { NextRequest, NextResponse } from "next/server";

// Helper to get API URL based on environment
function getBackendUrl(): string {
  // In development (Docker), use the service name
  if (process.env.NODE_ENV === "development") {
    return process.env.NEXT_PUBLIC_API_URL ||  "http://backend:5000/api";
  }
  // In production (Render), use the environment variable
  return (
    
    "https://blog-backend-5dai.onrender.com/api"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    // Get cookies from the incoming request
    const cookieString = request.headers.get("cookie") || "";

    console.log("📡 API Route - Environment:", process.env.NODE_ENV);
    console.log("📡 API Route - Cookies present:", cookieString.length > 0);
    console.log(
      "📡 API Route - Has accessToken:",
      cookieString.includes("accessToken"),
    );

    // Forward the request to backend
    const backendUrl = getBackendUrl();
    const url = `${backendUrl}/posts`;

    console.log("📡 Forwarding to backend:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieString && { Cookie: cookieString }),
      },
      body: JSON.stringify({ title, content }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("📡 Backend error:", response.status, data);
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

export async function GET(request: NextRequest) {
  try {
    const cookieString = request.headers.get("cookie") || "";

    const backendUrl = getBackendUrl();
    const url = `${backendUrl}/posts`;

    // Forward any query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const finalUrl = queryString ? `${url}?${queryString}` : url;

    const response = await fetch(finalUrl, {
      method: "GET",
      headers: {
        ...(cookieString && { Cookie: cookieString }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch posts" },
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
