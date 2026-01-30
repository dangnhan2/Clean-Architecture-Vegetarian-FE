"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface UnauthorizedPageProps {
  isUnauthenticated?: boolean;
  isUnauthorized?: boolean;
}

export default function UnauthorizedPage({ 
  isUnauthenticated = false, 
  isUnauthorized = false 
}: UnauthorizedPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-4">
              {isUnauthenticated ? (
                <Lock className="h-8 w-8 text-red-600" />
              ) : (
                <ShieldAlert className="h-8 w-8 text-orange-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {isUnauthenticated ? "Yêu cầu đăng nhập" : "Không có quyền truy cập"}
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            {isUnauthenticated 
              ? "Bạn cần đăng nhập để truy cập trang này."
              : "Bạn không có quyền truy cập trang này. Chỉ quản trị viên mới có thể truy cập."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {isUnauthenticated ? (
              <>
                <p className="text-sm text-gray-500 text-center">
                  Vui lòng đăng nhập để tiếp tục sử dụng dịch vụ.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="flex-1 bg-black text-white hover:bg-black/90"
                  >
                    Đăng nhập
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="flex-1"
                  >
                    Về trang chủ
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 text-center">
                  Trang này chỉ dành cho quản trị viên. Nếu bạn là quản trị viên, vui lòng đăng nhập bằng tài khoản admin.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="flex-1 bg-black text-white hover:bg-black/90"
                  >
                    Đăng nhập lại
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Về trang chủ
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

