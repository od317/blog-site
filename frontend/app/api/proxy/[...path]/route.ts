import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const pathname = path.join("/");

    console.log("🔀 API Proxy POST:", pathname);

    // Get the access token from HttpOnly cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    console.log("🔀 Access token present:", !!accessToken);

    // Build the backend URL
    const backendUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${backendUrl}/${pathname}`;

    // Check if this is a file upload (multipart/form-data)
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let body;
    const headers: Record<string, string> = {};

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    if (isMultipart) {
      // For file uploads, forward the raw body
      body = await request.formData();
      // Don't set Content-Type - let browser set it with boundary
    } else {
      // For JSON requests
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(await request.json());
    }

    console.log("🔀 Forwarding to backend:", url);
    console.log("🔀 Is multipart:", isMultipart);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: body as BodyInit,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("🔀 API Proxy POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const pathname = path.join("/");

    console.log("🔀 API Proxy DELETE:", pathname);

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    const backendUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${backendUrl}/${pathname}`;

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });
    const data = await response.json();
    console.log("deleting profile pic on server response", data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("🔀 API Proxy DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
