"use client"

import { z } from "zod"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"

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
import { Register } from "@/services/api"
import { toast } from "sonner"

const registerSchema = z.object({
  userName: z.string().min(2, {
    message: "Tên người dùng phải có ít nhất 5 ký tự.",
  }).max(50, {
    message: "Tên người dùng không được vượt quá 50 ký tự.",
  }),
  email: z.string().email({
    message: "Email không hợp lệ.",
  }),
  password: z.string().min(6, {
    message: "Mật khẩu phải có ít nhất 6 ký tự.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Mật khẩu xác nhận phải có ít nhất 6 ký tự.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp.",
  path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    let res = await Register(values.email, values.userName, values.password, values.confirmPassword)

    if (res?.isSuccess && Number(res.statusCode) === 201) {
      toast.success(res.message);
      router.push(`/auth/verify?flow=register&email=${encodeURIComponent(values.email)}`)
    } else {
      toast.error(res.message)
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 md:p-10 my-auto">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Tạo tài khoản
          </h1>
          <p className="text-gray-600 text-sm md:text-base text-center">
            Đăng ký để bắt đầu đặt món ngon
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
           
            {/* UserName Field */}
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên người dùng</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên người dùng của bạn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input type="password" placeholder="Tạo mật khẩu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Xác nhận mật khẩu của bạn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />                   

            {/* Create Account Button */}
            <Button 
              type="submit" 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              Tạo tài khoản
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
            Đã có tài khoản?{" "}
            <Link 
              href="/auth/login" 
              className="font-semibold text-gray-900 hover:underline"
            >
              Đăng nhập
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
    </div>
  )
}

