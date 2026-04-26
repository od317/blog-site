import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    console.log("📡 Updating pos:", id);
    console.log("📡 Cookies present:", !!cookieString);

    // Check content type to determine how to parse
    const contentType = request.headers.get("content-type") || "";

    const headers: Record<string, string> = {};

    if (cookieString) {
      headers["Cookie"] = cookieString;
    }

    const backendUrl = process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${backendUrl}/posts/${id}`;

    // Handle multipart/form-data (with image)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const forwardFormData = new FormData();

      // Forward all fields
      for (const [key, value] of formData.entries()) {
        forwardFormData.append(key, value);
      }

      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: forwardFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.error || "Failed to update post" },
          { status: response.status },
        );
      }

      return NextResponse.json(data);
    }

    const body = await request.json();

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to update post" },
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
