import { NextRequest, NextResponse } from "next/server";

// Helper to get API URL based on environment
function getBackendUrl(): string {
  // In development (Docker), use the service name
  if (process.env.NODE_ENV === "development") {
    return process.env.NEXT_PUBLIC_SERVER_API_URL!;
  }
  // In production (Render), use the environment variable
  return "https://blog-backend-5dai.onrender.com/api";
}

export async function POST(request: NextRequest) {
  try {
    // Check content type to determine how to parse the body
    const contentType = request.headers.get("content-type") || "";

    let body;
    const headers: Record<string, string> = {};

    // Get cookies from the incoming request
    const cookieString = request.headers.get("cookie") || "";

    if (cookieString) {
      headers["Cookie"] = cookieString;
    }

    console.log("📡 API Route - Content-Type:", contentType);
    console.log("📡 API Route - Environment:", process.env.NODE_ENV);
    console.log("📡 API Route - Cookies present:", cookieString.length > 0);

    // Handle multipart/form-data (file upload)
    if (contentType.includes("multipart/form-data")) {
      console.log("📡 Handling multipart/form-data request");

      // Forward the raw request body without parsing
      const formData = await request.formData();

      // Create new FormData to forward
      const forwardFormData = new FormData();
      for (const [key, value] of formData.entries()) {
        forwardFormData.append(key, value);
      }

      // Forward to backend without setting Content-Type (let fetch set it with boundary)
      const backendUrl = getBackendUrl();
      const url = `${backendUrl}/posts`;

      console.log("📡 Forwarding FormData to backend:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: forwardFormData,
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
    }

    // Handle JSON (regular requests)
    body = await request.json();
    const { title, content } = body;

    const backendUrl = getBackendUrl();
    const url = `${backendUrl}/posts`;

    console.log("📡 Forwarding JSON to backend:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
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

    const headers: Record<string, string> = {};
    if (cookieString) {
      headers["Cookie"] = cookieString;
    }

    const response = await fetch(finalUrl, {
      method: "GET",
      headers,
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
