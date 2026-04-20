import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    console.log("📡 API Route: Fetching dynamic profile for:", username);

    // ✅ Get cookies from the request (this is the key!)
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();
    console.log("📡 Cookies present:", !!cookieString);
    console.log("📡 Cookie string length:", cookieString.length);

    const backendUrl =
      process.env.NEXT_PUBLIC_SERVER_API_URL;
    const url = `${backendUrl}/profile/${username}`;
    console.log("📡 Fetching from backend:", url);

    // ✅ Forward cookies to backend
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieString, // ← THIS IS THE CRITICAL LINE
      },
      cache: "no-store",
    });

    console.log("📡 Backend response status:", response.status);

    if (!response.ok) {
      console.log("📡 Backend error:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("📡 Dynamic profile data received:", {
      username: data.username,
      isFollowing: data.isFollowing,
      isOwnProfile: data.isOwnProfile,
      followersCount: data.followers_count,
    });

    // Return only the dynamic fields the client needs
    return NextResponse.json({
      isFollowing: data.isFollowing,
      isOwnProfile: data.isOwnProfile,
      followersCount: data.followers_count,
    });
  } catch (error) {
    console.error("📡 API Route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
