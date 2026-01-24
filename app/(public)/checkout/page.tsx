"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, CreditCard, Tag, X, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/context";
import { CreateOrderWithCOD, CreateOrderWithQR, GetAddresses, GetVouchers, ValidateVoucher } from "@/services/api";
import { toast } from "sonner";

const TAX_RATE = 0.08;

const CheckoutPage = () => {
    const { cart, user, fetchCart } = useAuth();
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<"QR" | "COD">("QR");

    // Voucher
    const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
    const [vouchers, setVouchers] = useState<IVoucher[] | undefined>([]);
    const [appliedVoucherId, setAppliedVoucherId] = useState<string | null>(null);
    const [selectedVoucherIdInModal, setSelectedVoucherIdInModal] = useState<string | null>(null);
    const [loadingVouchers, setLoadingVouchers] = useState(false);
    const [addresses, setAddresses] = useState<IAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [voucherValidationInfo, setVoucherValidationInfo] = useState<IVoucherValidationInfo>();
    const [confirmOrderDialogOpen, setConfirmOrderDialogOpen] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const cartItems = cart?.items || [];

    const fetchAddresses = async () => {
        if (user?.id) {
            const res = await GetAddresses(user?.id);
            if (res.isSuccess && res.data) {
                setAddresses(res.data);
            }
        }
    }

    useEffect(() => {
        if (user?.id) {
            fetchAddresses();
        }
    }, [user?.id]);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("vi-VN") + "₫";
    };

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
    );

    // Fetch vouchers when modal opens
    useEffect(() => {
        if (voucherDialogOpen) {
            fetchVouchers();
            setSelectedVoucherIdInModal(appliedVoucherId); // Set initial selection to currently applied voucher
        }
    }, [voucherDialogOpen]);

    const fetchVouchers = async () => {
        setLoadingVouchers(true);
        try {
            const res = await GetVouchers();
            if (res.isSuccess && Number(res.statusCode) === 200) {
                // Filter only active vouchers
                const activeVouchers = res?.data?.filter(
                    (voucher) => voucher.isActive &&
                        new Date(voucher.endDate) > new Date() &&
                        new Date(voucher.startDate) <= new Date()
                );
                setVouchers(activeVouchers);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách voucher");
        } finally {
            setLoadingVouchers(false);
        }
    };


    const handleApplyVoucher = async () => {
        if (user?.id && selectedVoucherIdInModal) {
            let res = await ValidateVoucher(user.id, selectedVoucherIdInModal);
            if (res.isSuccess && Number(res.statusCode) === 200) {
                if (res.data !== null && res.data !== undefined) {
                    setVoucherValidationInfo(res.data);
                    setAppliedVoucherId(selectedVoucherIdInModal);
                    setVoucherDialogOpen(false);
                    toast.success(res.message);
                }
            } else {
                toast.error(res.message || "Không thể áp dụng voucher");
            }
        }
    };

    const tax = subtotal * TAX_RATE;

    // Get selected voucher for display purposes only
    const selectedVoucher = vouchers?.find(v => v.id === appliedVoucherId) || null;

    // Use totalAmount from API validation result if voucher is applied, otherwise calculate from subtotal + tax
    const total = voucherValidationInfo?.totalAmount ?? (subtotal + tax);

    const handlePlaceOrder = async () => {
        if (!user?.id) {
            toast.error("Vui lòng đăng nhập để đặt hàng");
            return;
        }

        if (!selectedAddressId) {
            toast.error("Vui lòng chọn địa chỉ giao hàng");
            setConfirmOrderDialogOpen(false);
            return;
        }

        setIsPlacingOrder(true);
        try {
            if (paymentMethod === "QR") {
                // Prepare returnUrl for backend to create RETURN_URL with orderCode
                const returnUrl = typeof window !== "undefined" 
                    ? `${window.location.origin}/checkout/success?orderCode={orderCode}&paymentMethod=QR`
                    : undefined;
                
                let res = await CreateOrderWithQR(
                    user.id,
                    appliedVoucherId,
                    selectedAddressId,
                    note || null,
                    paymentMethod,
                    total,
                    returnUrl
                );
                if (res.isSuccess && Number(res.statusCode) === 201 && res.data) {
                    toast.success(res.message);
                    setConfirmOrderDialogOpen(false);
                    
                    // Fetch cart again to clear it after order creation
                    await fetchCart();
                    
                    // API returns IOrderInfo with checkoutUrl and orderCode
                    const orderInfo = res.data as IOrderInfo;
                    if (orderInfo.checkoutUrl) {
                        // Backend should have configured RETURN_URL as: 
                        // {returnUrl}/checkout/success?orderCode=${orderCode}&paymentMethod=QR
                        // Redirect to PayOS checkout URL
                        window.location.href = orderInfo.checkoutUrl;
                    } else {
                        toast.error("Không tìm thấy URL thanh toán");
                    }
                } else {
                    toast.error(res.message || "Không thể đặt hàng. Vui lòng thử lại");
                }
            }
            else if (paymentMethod === "COD") {
                let res = await CreateOrderWithCOD(
                    user.id,
                    appliedVoucherId,
                    selectedAddressId,
                    note || null,
                    paymentMethod,
                    total
                );
                if (res.isSuccess && Number(res.statusCode) === 201) {
                    toast.success(res.message)
                    setConfirmOrderDialogOpen(false);
                    fetchCart();
                    router.push(`/checkout/success?orderCode=${res.data}&paymentMethod=${paymentMethod}`)
                } else {
                    toast.error(res.message || "Không thể đặt hàng. Vui lòng thử lại");
                }
            }
        } catch (error) {
            console.error("Error placing order:", error);
            toast.error("Có lỗi xảy ra. Vui lòng thử lại");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handleOpenConfirmDialog = () => {
        if (!selectedAddressId) {
            toast.error("Vui lòng chọn địa chỉ giao hàng");
            return;
        }
        setConfirmOrderDialogOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#F7F7F8]">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Back to Cart */}
                <Link
                    href="/cart"
                    className="flex items-center gap-2 text-gray-700 hover:text-black mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại giỏ hàng
                </Link>

                <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Delivery & Payment Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Delivery Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Địa chỉ giao hàng
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {addresses.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p className="mb-4">Bạn chưa có địa chỉ nào</p>
                                        <Link href="/account/profile">
                                            <Button variant="outline">Thêm địa chỉ</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <RadioGroup
                                        value={selectedAddressId}
                                        onValueChange={setSelectedAddressId}
                                        className="space-y-3"
                                    >
                                        {addresses.map((address) => {
                                            const isSelected = selectedAddressId === address.id;


                                            return (
                                                <label
                                                    key={address.id}
                                                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                        ? "border-purple-600 bg-purple-50/50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                        }`}
                                                >
                                                    <div className="mt-1">
                                                        <RadioGroupItem
                                                            value={address.id}
                                                            id={address.id}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        {/* Name and Phone */}
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-semibold text-base">
                                                                {address.fullName || "N/A"}
                                                            </span>
                                                            <span className="text-gray-400">|</span>
                                                            <span className="text-gray-600">
                                                                {address.phoneNumber || "N/A"}
                                                            </span>

                                                        </div>

                                                        {/* Full Address */}
                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            {address.address}
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </RadioGroup>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Phương thức thanh toán
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup
                                    value={paymentMethod}
                                    onValueChange={(value) =>
                                        setPaymentMethod(value as "QR" | "COD")
                                    }
                                    className="space-y-3"
                                >
                                    <label
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "QR"
                                            ? "border-black bg-gray-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <RadioGroupItem value="QR" id="QR" />
                                        <span className="font-semibold">
                                            Thanh toán với mã QR
                                        </span>
                                    </label>

                                    <label
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "COD"
                                            ? "border-black bg-gray-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <RadioGroupItem value="COD" id="COD" />
                                        <span className="font-semibold">Thanh toán khi nhận hàng</span>
                                    </label>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                        {/* Order Note */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Ghi chú đơn hàng
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Ví dụ: Giao giờ nghỉ trưa, không ớt, gọi trước khi đến..."
                                        className="w-full min-h-[100px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:border-black"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Tóm tắt đơn hàng</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Order Items */}
                                <div className="space-y-3">
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between"
                                        >
                                            <span className="text-sm">
                                                {item.menuName} x {item.quantity}
                                            </span>
                                            <span className="font-semibold">
                                                {formatCurrency(item.unitPrice * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4">
                                    {/* Apply Voucher */}
                                    <div className="space-y-2">
                                        {!selectedVoucher ? (
                                            <Button
                                                variant="outline"
                                                onClick={() => setVoucherDialogOpen(true)}
                                                className="w-full border-dashed"
                                            >
                                                <Tag className="w-4 h-4 mr-2" />
                                                Voucher
                                            </Button>
                                        ) : (
                                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-green-700">
                                                        {selectedVoucher.code}
                                                    </div>
                                                    {selectedVoucher.discountType === "percent" ? (
                                                        <div className="text-xs text-green-600">
                                                            Giảm {selectedVoucher.discountValue}%
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-green-600">
                                                            Giảm {formatCurrency(selectedVoucher.discountValue)}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setAppliedVoucherId(null);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Tạm tính</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span>Thuế ({TAX_RATE * 100}%)</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                    {selectedVoucher && voucherValidationInfo && (
                                        <div className="flex items-center justify-between text-sm text-green-600">
                                            <span>Giảm giá</span>
                                            <span>-{formatCurrency(voucherValidationInfo.discountAmount)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-bold text-lg">Tổng cộng</span>
                                        {selectedVoucher && voucherValidationInfo ? (
                                            <span className="font-bold text-lg">
                                                {formatCurrency(voucherValidationInfo.totalAmount)}
                                            </span>
                                        ) : (
                                            <span className="font-bold text-lg">
                                                {formatCurrency(total)}
                                            </span>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleOpenConfirmDialog}
                                        className="w-full bg-black hover:bg-black/90 text-white h-12"
                                        disabled={!selectedAddressId}
                                    >
                                        Đặt hàng
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Voucher Dialog */}
            <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chọn Voucher</DialogTitle>
                        <div className="mt-1 text-xs text-gray-500">
                            Mỗi voucher chỉ được sử dụng 1 lần trong ngày
                        </div>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {loadingVouchers ? (
                            <div className="text-center py-8 text-gray-500">
                                Đang tải voucher...
                            </div>
                        ) : vouchers?.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Không có voucher khả dụng
                            </div>
                        ) : (
                            <RadioGroup
                                value={selectedVoucherIdInModal || ""}
                                onValueChange={(value) => {
                                    // Đảm bảo lưu đúng id của voucher dạng string
                                    setSelectedVoucherIdInModal(value || null);
                                }}
                                className="space-y-3"
                            >
                                {vouchers?.map((voucher) => {
                                    const isEligible = subtotal >= voucher.minOrderAmount;
                                    const isSelected = selectedVoucherIdInModal === voucher.id;

                                    return (
                                        <label
                                            key={voucher.id}
                                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                ? "border-green-500 bg-green-50"
                                                : isEligible
                                                    ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                    : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                                                }`}
                                        >
                                            <div className="mt-1">
                                                <RadioGroupItem
                                                    value={voucher.id}
                                                    id={voucher.id}
                                                    disabled={!isEligible}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Tag className="w-4 h-4 text-green-600" />
                                                    <span className="font-bold text-lg">
                                                        {voucher.code}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {voucher.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                                    <span>
                                                        Đơn tối thiểu:{" "}
                                                        {formatCurrency(voucher.minOrderAmount)}
                                                    </span>
                                                </div>

                                                {!isEligible && (
                                                    <div className="mt-2 text-xs text-red-600">
                                                        Cần thêm{" "}
                                                        {formatCurrency(
                                                            voucher.minOrderAmount - subtotal
                                                        )}{" "}
                                                        để sử dụng
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                            </RadioGroup>
                        )}
                    </div>
                    {!loadingVouchers && vouchers && vouchers.length > 0 && (
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setVoucherDialogOpen(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleApplyVoucher}
                                disabled={!selectedVoucherIdInModal}
                                className="bg-black hover:bg-black/90 text-white"
                            >
                                Áp dụng
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirm Order Dialog */}
            <Dialog open={confirmOrderDialogOpen} onOpenChange={setConfirmOrderDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xác nhận đặt hàng</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn đặt hàng này không?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tổng tiền:</span>
                                <span className="font-semibold">
                                    {selectedVoucher && voucherValidationInfo
                                        ? formatCurrency(voucherValidationInfo.totalAmount)
                                        : formatCurrency(total)
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phương thức thanh toán:</span>
                                <span className="font-semibold">
                                    {paymentMethod === "QR" ? "Thanh toán QR" : "Thanh toán khi nhận hàng"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOrderDialogOpen(false)}
                            disabled={isPlacingOrder}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handlePlaceOrder}
                            disabled={isPlacingOrder}
                            className="bg-black hover:bg-black/90 text-white"
                        >
                            {isPlacingOrder ? "Đang xử lý..." : "Xác nhận đặt hàng"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default CheckoutPage;

