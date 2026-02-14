"use client"

import { z } from "zod"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
 
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Login, ResendEmail, LoginGoogle } from "@/services/api"
import { toast } from "sonner"
import { useAuth } from "@/context/context"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Mail } from "lucide-react"
 
const loginSchema = z.object({
  email: z.string().email({
    message: "Email không được để trống.",
  }),
  password: z.string().min(6, {
    message: "Mật khẩu phải có ít nhất 6 ký tự.",
  }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const {setUser, setIsAuthen} = useAuth();
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string>("")
  const [isResending, setIsResending] = useState(false)
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    
    try {
      let res = await Login(values.email, values.password)
      console.log("Login response:", res)
      
      if (res?.isSuccess && Number(res.statusCode) === 200) {
        const token = res.data?.accessToken
        if (token) {
          localStorage.setItem("access_token", token)
          setUser(res.data?.data)
          setIsAuthen(true)
        }
        
        toast.success(res.message || "Đăng nhập thành công")
        
        // Redirect to original page if exists
        const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/";
        router.push(redirectTo)
      } else {
        // Kiểm tra nếu là lỗi tài khoản bị khóa (401)
        const statusCode = Number(res?.statusCode) || 0
        const message = res?.message || "Đăng nhập thất bại. Vui lòng thử lại."
        
        console.log("Login failed - Status:", statusCode, "Message:", message)
        
        // Kiểm tra nếu là lỗi email chưa xác nhận
        if (message.includes("Tài khoản của bạn chưa được xác nhận")) {
          setPendingEmail(values.email)
          setShowConfirmDialog(true)
        } else if (statusCode === 401) {
          toast.error(message, {
            duration: 5000,
          })
        } else {
          toast.error(message)
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      const errorMsg = error?.message || error?.response?.data?.message || "Có lỗi xảy ra khi đăng nhập"
      
      // Kiểm tra nếu error response có message về email chưa xác nhận
      if (errorMsg.includes("Tài khoản của bạn chưa được xác nhận")) {
        setPendingEmail(values.email)
        setShowConfirmDialog(true)
      } else {
        toast.error(errorMsg)
      }
    } finally {
      console.log("Setting isLoading to false")
      setIsLoading(false)
    }
  }

  const handleConfirmResendEmail = async () => {
    if (!pendingEmail) return

    try {
      setIsResending(true)
      const res = await ResendEmail(pendingEmail)
      
      if (res?.isSuccess && Number(res.statusCode) === 200) {
        toast.success(res.message || "Đã gửi lại mã xác nhận đến email của bạn")
        setShowConfirmDialog(false)
        router.push(`/auth/verify?flow=register&email=${encodeURIComponent(pendingEmail)}`)
      } else {
        toast.error(res?.message || "Không thể gửi lại mã xác nhận")
      }
    } catch (error: any) {
      console.error("Error resending email:", error)
      toast.error("Có lỗi xảy ra khi gửi lại mã xác nhận. Vui lòng thử lại sau.")
    } finally {
      setIsResending(false)
    }
  }

  const handleCancelDialog = () => {
    setShowConfirmDialog(false)
    setPendingEmail("")
  }

  const handleDialogChange = (open: boolean) => {
    setShowConfirmDialog(open)
    if (!open) {
      setPendingEmail("")
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 md:p-10 my-auto">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
           Chào mừng trở lại
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Đăng nhập để tiếp tục
          </p>
        </div>


        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Nhập mật khẩu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forgot Password */}
            <div className="flex items-center justify-between">            
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button 
              type="submit" 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </Form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Hoặc</span>
          </div>
        </div>

        {/* Google Login Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
          onClick={() => LoginGoogle()}
          disabled={isLoading}
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Đăng nhập với Google
        </Button>

        {/* Footer Links */}
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <Link 
              href="/auth/register" 
              className="font-semibold text-gray-900 hover:underline"
            >
              Đăng ký
            </Link>
          </p>
          <Link 
            href="/" 
            className="block text-sm text-gray-900 hover:underline font-medium"
          >
            Tiếp tục dưới dạng khách
          </Link>
        </div>
      </div>

      {/* Confirm Resend Email Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-bold text-gray-900">
              Xác nhận gửi lại email
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 pt-2">
              Tài khoản của bạn chưa được xác nhận. Bạn có muốn chúng tôi gửi lại mã xác nhận đến email <span className="font-semibold text-gray-900">{pendingEmail}</span> không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={handleCancelDialog}
              disabled={isResending}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmResendEmail}
              disabled={isResending}
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}