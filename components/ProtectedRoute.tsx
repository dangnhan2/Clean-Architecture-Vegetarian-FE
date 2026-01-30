"use client";

import { useAuth } from "@/context/context";
import UnauthorizedPage from "./UnauthorizedPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthen } = useAuth();

  // Show loading while checking authentication
  if (isAuthen === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-900 border-r-transparent mb-4"></div>
          <div className="text-gray-600">Đang tải...</div>
        </div>
      </div>
    );
  }

  // Show unauthorized page if not authenticated
  if (!isAuthen || !user) {
    return <UnauthorizedPage isUnauthenticated={true} />;
  }

  // Show unauthorized page if admin required but user is not admin
  if (requireAdmin && user.role !== "Admin") {
    return <UnauthorizedPage isUnauthorized={true} />;
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}

