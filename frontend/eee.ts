import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/profile", "/settings", "/dashboard"];
// Routes that are only for unauthenticated users (login, register)
const PUBLIC_ONLY_ROUTES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires authentication
  const requiresAuth = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  // Check if the route is for public-only (login/register)
  const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.includes(pathname);

  // Skip token validation for public routes that don't require auth
  if (!requiresAuth && !isPublicOnlyRoute) {
    return NextResponse.next();
  }

  // Get the API URL from environment
  const apiUrl = "http://backend:5000/api";

  // Call the backend to validate the token
  try {
    const validateResponse = await fetch(`${apiUrl}/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    });
    const isAuthenticated = validateResponse.ok;

    // Handle protected routes - redirect to login if not authenticated
    if (requiresAuth && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      const loginUrl = new URL(`/login?returnUrl=${returnUrl}`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Handle public-only routes - redirect to home if authenticated
    if (isPublicOnlyRoute && isAuthenticated) {
      const returnUrl = request.nextUrl.searchParams.get("returnUrl");
      const homeUrl = new URL(returnUrl || "/", request.url);
      return NextResponse.redirect(homeUrl);
    }

    // Forward any new cookies from the validation response
    const response = NextResponse.next();
    const newCookies = validateResponse.headers.get("set-cookie");
    if (newCookies) {
      const cookieStrings = newCookies.split(",");
      for (const cookie of cookieStrings) {
        response.headers.append("Set-Cookie", cookie);
      }
    }

    return response;
  } catch (error) {
    console.error("Token validation error:", error);

    // On error, treat as unauthenticated for protected routes
    if (requiresAuth) {
      const returnUrl = encodeURIComponent(pathname);
      const loginUrl = new URL(`/login?returnUrl=${returnUrl}`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately by backend)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|public).*)",
  ],
};
