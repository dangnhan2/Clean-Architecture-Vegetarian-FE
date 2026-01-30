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

  // Note: Token is now stored in localStorage only (client-side)
  // Middleware cannot access localStorage, so we cannot check authentication here
  // Route protection is handled by ProtectedRoute component using React Context
  // This middleware is kept for potential future server-side checks if needed

  // Check if accessing protected route
  // These routes require authentication (handled by ProtectedRoute component):
  // - /checkout, /account, /purchase, /cart
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if accessing admin route
  // Admin routes require Admin role (handled by ProtectedRoute component with requireAdmin=true)
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if accessing public auth route
  const isPublicAuthRoute = publicAuthRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // All route protection is handled client-side by ProtectedRoute component
  // which uses React Context to check authentication and user role
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

