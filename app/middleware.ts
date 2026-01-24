import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/account",
  "/checkout",
  "/purchase",
  "/cart",
];

// Routes that require admin role
const adminRoutes = ["/admin"];

// Public routes that should redirect to home if already authenticated
const publicAuthRoutes = ["/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies (since middleware runs on server, we can't access localStorage)
  // Token can be stored in cookies by setting it in login/register pages
  const token = request.cookies.get("access_token")?.value;

  // Check if accessing protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if accessing admin route
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if accessing public auth route
  const isPublicAuthRoute = publicAuthRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to login if accessing admin route without token
  if (isAdminRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Optional: Redirect authenticated users away from login/register pages
  // Note: This might not work perfectly if user only has localStorage token (not cookie)
  // Better to handle this on client-side
  if (isPublicAuthRoute && token) {
    const redirectTo = request.nextUrl.searchParams.get("redirect") || "/";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

