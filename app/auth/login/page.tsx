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
import { Login, ResendEmail } from "@/services/api"
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
          // Set cookie for middleware access
          const expires = new Date();
          expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
          document.cookie = `access_token=${token};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
          
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
        <div className="my-6">
          <div className="h-px bg-gray-200"></div>
        </div>

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