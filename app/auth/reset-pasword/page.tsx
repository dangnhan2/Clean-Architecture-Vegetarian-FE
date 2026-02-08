"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ResetPassword } from "@/services/api"
import { toast } from "sonner"

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, {
    message: "Mật khẩu phải có ít nhất 6 ký tự.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Mật khẩu xác nhận phải có ít nhất 6 ký tự.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu không khớp.",
  path: ["confirmPassword"],
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage({ email }: { email?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const finalEmail = email || searchParams.get("email") || ""
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  // No live rules; errors will show on submit by FormMessage

  const onSubmit = async (values: ResetPasswordValues) => {
    let res = await ResetPassword(finalEmail, values.newPassword, values.confirmPassword);
    console.log(res);
    if (res.isSuccess && Number(res.statusCode) === 201){
      toast.success(res.message)
      router.push("/auth/login")
    }else{
      toast.error(res.message)
    }    
  }

  return (
    <div className="min-h-screen overflow-y-auto flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-8 md:p-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-gray-900 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Title & Email Info */}
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">Reset Password</h1>
        <p className="text-center text-gray-500">Tạo mật khẩu mới cho tài khoản</p>
        <p className="text-center text-gray-900 font-medium mb-8">{finalEmail}</p>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter new password" className="bg-gray-100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm new password" className="bg-gray-100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-gray-900 hover:bg-gray-800 text-white"
            >
              Cập nhật mật khẩu
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}


