"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Package, Copy, Check, Home, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SuccessPageContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderCode = searchParams.get("orderCode");
    const paymentMethod = searchParams.get("paymentMethod");

    const [orderData, setOrderData] = useState<IOrderInfo | null>(null);
    const [cartItems, setCartItems] = useState<ICartItem[]>([]);
    const [copied, setCopied] = useState(false);

    const totalAmount = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    }, [cartItems]);

    useEffect(() => {
        if (!orderCode) {
            toast.error("Không tìm thấy mã đơn hàng");
            router.replace("/checkout");
            return;
        }

        // Try to get order data from localStorage (saved from QR page)
        const storageKey = `qrOrderData_${orderCode}`;
        const raw = localStorage.getItem(storageKey);

        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed.orderCode === orderCode) {
                    const { cartItems: storedCartItems, ...orderInfo } = parsed;
                    setOrderData(orderInfo as IOrderInfo);
                    setCartItems(storedCartItems || []);
                }
            } catch (err) {
                console.error("Parse order error:", err);
            }
        }
    }, [orderCode, router]);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("vi-VN") + "₫";
    };

    const handleCopyOrderCode = () => {
        if (orderCode) {
            navigator.clipboard.writeText(orderCode);
            setCopied(true);
            toast.success("Đã sao chép mã đơn hàng");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getPaymentMethodText = (method: string | null) => {
        // Hỗ trợ cả kiểu cũ ("QR" / "COD") và kiểu mới ("1" / "0")
        if (method === "QR" || method === "1") return "Thanh toán QR";
        if (method === "COD" || method === "0") return "Thanh toán khi nhận hàng";
        return "Thanh toán";
    };

    return (
        <div className="min-h-screen bg-[#F7F7F8]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold">Thanh toán thành công!</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column - Success Message */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* Success Card */}
                        <Card className="overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                    Thanh toán thành công
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm mt-2">
                                    Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xác nhận.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 sm:space-y-6">
                                {/* Success Icon */}
                                <div className="flex justify-center py-4">
                                    <div className="relative p-6 sm:p-8 bg-green-50 rounded-full">
                                        <CheckCircle2 className="w-24 h-24 sm:w-32 sm:h-32 text-green-600" />
                                    </div>
                                </div>

                                {/* Success Message */}
                                <Card className="bg-green-50 border-green-200">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h3 className="font-semibold text-sm sm:text-base mb-1 text-green-900">
                                                    Đơn hàng đã được thanh toán thành công
                                                </h3>
                                                <p className="text-xs sm:text-sm text-green-800">
                                                    Đơn hàng của bạn đã được xác nhận và đang được xử lý. 
                                                    Bạn sẽ nhận được thông báo khi đơn hàng được giao.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Order Code */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                        <span className="text-sm sm:text-base text-gray-600">Mã đơn hàng:</span>
                                        <span className="font-mono font-semibold text-sm sm:text-base">
                                            #{orderCode}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyOrderCode}
                                        className="w-full sm:w-auto"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Đã sao chép
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 mr-2" />
                                                Sao chép
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Payment Method */}
                                {paymentMethod && (
                                    <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <Receipt className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm sm:text-base text-blue-900">
                                            Phương thức thanh toán: <strong>{getPaymentMethodText(paymentMethod)}</strong>
                                        </span>
                                    </div>
                                )}

                                {/* Next Steps */}
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="pt-6">
                                        <h3 className="font-semibold text-sm sm:text-base mb-3 text-blue-900">
                                            Bước tiếp theo:
                                        </h3>
                                        <ol className="space-y-2 text-xs sm:text-sm text-blue-800 list-decimal list-inside">
                                            <li>Đơn hàng của bạn đang được xử lý</li>
                                            <li>Bạn sẽ nhận được thông báo khi đơn hàng được xác nhận</li>
                                            <li>Theo dõi trạng thái đơn hàng trong mục "Đơn hàng của tôi"</li>
                                            <li>Đơn hàng sẽ được giao trong thời gian sớm nhất</li>
                                        </ol>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="lg:sticky lg:top-4 lg:top-6">
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl">Tóm tắt đơn hàng</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Order Items */}
                                {orderData && cartItems.length > 0 ? (
                                    <>
                                        <div className="space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                            {cartItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                                                >
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.menuName}
                                                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = "none";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                            <Package className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm sm:text-base truncate">
                                                            {item.menuName}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-xs sm:text-sm text-gray-500">
                                                                Số lượng: {item.quantity}
                                                            </span>
                                                            <span className="font-semibold text-sm sm:text-base">
                                                                {formatCurrency(item.unitPrice * item.quantity)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Total Amount */}
                                        <div className="border-t pt-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm sm:text-base font-semibold">Tổng thanh toán</span>
                                                <span className="text-lg sm:text-xl font-bold text-black">
                                                    {formatCurrency(totalAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">
                                            {orderCode ? `Mã đơn hàng: #${orderCode}` : "Không có thông tin đơn hàng"}
                                        </p>
                                    </div>
                                )}

                                {/* Success Badge */}
                                <Card className="bg-green-50 border-green-200 mt-4">
                                    <CardContent className="pt-4">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-sm text-green-900 mb-1">
                                                    Thanh toán thành công
                                                </p>
                                                <p className="text-xs text-green-800">
                                                    Đơn hàng của bạn đã được xác nhận và đang được xử lý.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-2">
                                    <Button
                                        onClick={() => router.push("/purchase")}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Xem đơn hàng của tôi
                                    </Button>
                                    <Link href="/" className="block">
                                        <Button variant="ghost" className="w-full">
                                            <Home className="w-4 h-4 mr-2" />
                                            Tiếp tục mua sắm
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SuccessPage = () => {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải...</p>
                    </div>
                </div>
            }
        >
            <SuccessPageContent />
        </Suspense>
    );
};

export default SuccessPage;


