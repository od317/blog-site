import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    const cookieString = request.headers.get("cookie") || "";
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
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

    // Revalidate all affected paths
    revalidatePath("/");
    revalidatePath(`/posts/${data.id}`);
    revalidatePath(`/profile/${data.username}`);

    // If you have a tag-based revalidation, you can also use:
    // revalidateTag("posts");

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Example for DELETE method
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    const cookieString = request.headers.get("cookie") || "";
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts/${postId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Cookie: cookieString,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: response.status },
      );
    }

    // Revalidate after deletion
    revalidatePath("/");
    revalidatePath(`/posts/${postId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Example for PUT method (update)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");
    const body = await request.json();
    const { title, content } = body;

    const cookieString = request.headers.get("cookie") || "";
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://backend:5000/api";
    const url = `${baseUrl}/posts/${postId}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString,
      },
      body: JSON.stringify({ title, content }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to update post" },
        { status: response.status },
      );
    }

    // Revalidate after update
    revalidatePath("/");
    revalidatePath(`/posts/${postId}`);
    revalidatePath(`/profile/${data.username}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
