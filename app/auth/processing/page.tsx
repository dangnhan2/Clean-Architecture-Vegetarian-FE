"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/context"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

function ProcessingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refresh, setAccessToken } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Bước 1: Lấy token từ URL (backend redirect về /auth/processing?token=...)
        let token: string | null = null

        try {
          token = searchParams.get("token")        
        } catch (e) {
          if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search)
            token = urlParams.get("token")
          }
        }

        // Nếu không lấy được token -> báo lỗi và điều hướng về trang login
        if (!token) {
          return
        }

        // Bước 2: Lưu access token vào localStorage
        localStorage.setItem("access_token", token)
        console.log("Token đã được lưu vào localStorage")
        
        // Bước 3: Cập nhật accessToken state
        setAccessToken(token as string)
        
        // Đợi một chút để đảm bảo state đã được cập nhật và interceptor có thể đọc token
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Bước 4: Gọi API refreshToken để lấy thông tin user và hoàn tất đăng nhập
        try {
          await refresh()
          console.log("RefreshToken thành công")
          
          // Đợi một chút để đảm bảo state đã được cập nhật hoàn toàn
          await new Promise((resolve) => setTimeout(resolve, 200))
          
          toast.success("Đăng nhập thành công!")
          
          // Xóa token khỏi URL để bảo mật
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href)
            url.searchParams.delete("token")
            window.history.replaceState({}, "", url.pathname + url.search)
          }

          // Đợi thêm một chút trước khi navigate để đảm bảo mọi thứ đã được lưu
          await new Promise((resolve) => setTimeout(resolve, 100))

          // Chuyển hướng về trang chính
          router.push("/")
        } catch (refreshError: any) {
          console.error("RefreshToken error:", refreshError)
          const errorMsg =
            refreshError?.message ||
            refreshError?.response?.data?.message ||
            "Có lỗi xảy ra khi làm mới token"
          setError(errorMsg)
          toast.error(errorMsg)

          // Xóa token nếu refresh thất bại
          localStorage.removeItem("access_token")
          setAccessToken(undefined)

          setTimeout(() => {
            router.push("/auth/login")
          }, 2000)
        }
      } catch (err: any) {
        console.error("Processing error:", err)
        setError(err?.message || "Có lỗi xảy ra")
        toast.error("Có lỗi xảy ra khi xử lý đăng nhập")
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      }
    }

    processAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 md:p-10 text-center">
        {error ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-red-600 mb-4">
              Đăng nhập thất bại
            </h1>
            <p className="text-gray-600 text-sm md:text-base mb-6">
              {error}
            </p>
            <p className="text-gray-500 text-xs">
              Đang chuyển hướng về trang đăng nhập...
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Đang xử lý đăng nhập...
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Vui lòng đợi trong giây lát
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 md:p-10 text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Đang tải...
            </h1>
          </div>
        </div>
      }
    >
      <ProcessingPageContent />
    </Suspense>
  )
}
