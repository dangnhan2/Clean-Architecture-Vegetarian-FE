"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { ArrowLeft, Mail, Loader2 } from "lucide-react"
import { VerifyEmail, ResendEmail } from "@/services/api"
import { toast } from "sonner"

function VerifyEmailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const flow = searchParams.get("flow") || "register"
  const emailParam = searchParams.get("email") || ""
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const verifySchema = z.object({
    code: z.string().min(6, { message: "Mã xác nhận phải đủ 6 số" }).regex(/^\d{6}$/g, { message: "Chỉ nhập số" })
  })
  type VerifyValues = z.infer<typeof verifySchema>

  const form = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  })

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    const newCode = [...code]

    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6 && /^\d$/.test(pastedData[i])) {
        newCode[i] = pastedData[i]
      }
    }

    setCode(newCode)
    
    // Focus next empty input or last input
    const nextEmptyIndex = newCode.findIndex((val) => !val)
    const indexToFocus = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
    inputRefs.current[indexToFocus]?.focus()
  }

  const handleVerify = async() => {
    let res = await VerifyEmail(emailParam, code.join(""))
    console.log(res)
    if (res?.isSuccess && Number(res.statusCode) === 200) {
      toast.success(res.message);
      if (flow === "reset") {
        router.push(`/auth/reset-pasword?email=${encodeURIComponent(emailParam)}`)
      } else {
        router.push("/auth/login")
      }
    } else {
      toast.error(res.message)
    }
    // After verifying OTP, route based on flow
    
  }

  const handleResendCode = async () => {
    if (!emailParam) {
      toast.error("Không tìm thấy địa chỉ email")
      return
    }

    if (countdown > 0) {
      return
    }

    try {
      setIsResending(true)
      const res = await ResendEmail(emailParam)
      
      if (res?.isSuccess && Number(res.statusCode) === 201) {
        toast.success(res.message || "Đã gửi lại mã xác nhận thành công")
        setCountdown(60) // Set countdown to 60 seconds
      } else {
        toast.error(res?.message || "Không thể gửi lại mã xác nhận")
      }
    } catch (error) {
      console.error("Error resending email:", error)
      toast.error("Có lỗi xảy ra khi gửi lại mã xác nhận")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 md:p-10">
        {/* Back Button */}
        <Link
          href={flow === "reset" ? "/auth/forgot-password" : "/auth/login"}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-base">Back</span>
        </Link>

        {/* Envelope Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-lg bg-gray-900 flex items-center justify-center">
            <Mail className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Xác nhận email
        </h1>

        {/* Description */}
        <p className="text-gray-500 text-center mb-2 text-sm">
          Chúng tôi đã gửi mã xác nhận 6 chữ số đến email của bạn
        </p>

        {/* Email Address */}
        <p className="text-gray-900 font-medium text-center mb-8">
          {emailParam || "(không có email)"}
        </p>

        {/* Code Input Fields */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(() => handleVerify())}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="flex justify-center gap-2">
                      {code.map((digit, index) => (
                        <Input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            handleChange(index, e.target.value)
                            const joined = [...code]
                            joined[index] = e.target.value
                            form.setValue("code", joined.join(""))
                          }}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={(e) => {
                            handlePaste(e)
                            const text = e.clipboardData.getData("text").slice(0, 6)
                            form.setValue("code", text)
                          }}
                          className="w-12 h-14 text-center text-lg font-semibold"
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Verify Button */}
            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base font-medium mb-4"
            >
              Xác nhận email
            </Button>
          </form>
        </Form>

        {/* Resend Code */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Không nhận được mã xác nhận?{" "}
            <button
              onClick={handleResendCode}
              disabled={isResending || countdown > 0}
              className={`font-semibold ${
                isResending || countdown > 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-900 hover:underline"
              } transition-colors`}
            >
              {isResending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin inline" />
                  Đang gửi...
                </span>
              ) : countdown > 0 ? (
                `Gửi lại sau ${countdown}s`
              ) : (
                "Gửi lại mã xác nhận"
              )}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 md:p-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-lg bg-gray-900 flex items-center justify-center">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Đang tải...</h1>
          </div>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  )
}
