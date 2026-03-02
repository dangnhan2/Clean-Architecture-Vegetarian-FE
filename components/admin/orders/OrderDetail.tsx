"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface OrderDetailProps {
    order: IOrderHistory;
}

const getPaymentMethodLabel = (
    method: number | string | null | undefined
): string => {
    if (method === 1 || method === "1" || method === "QR") {
        return "Thanh toán QR";
    }
    if (method === 0 || method === "0" || method === "COD") {
        return "Thanh toán khi nhận hàng";
    }
    return method ? String(method) : "--";
};

// Thiết kế badge trạng thái bám theo mapping ở trang purchase
// 1: Đã thanh toán (default)
// 2: Hết hạn thanh toán (destructive)
// 3: Đã hủy (outline)
// 4: Hoàn tiền (secondary)
// 5: Đã xác nhận đơn hàng (default)
const getOrderStatusBadge = (status: number) => {
    switch (status) {
        case 1:
            return (
                <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">
                    Đã thanh toán
                </Badge>
            );
        case 2:
            return (
                <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                    Hết hạn thanh toán
                </Badge>
            );
        case 3:
            return (
                <Badge variant="outline" className="border-gray-300 text-gray-700">
                    Đã hủy
                </Badge>
            );
        case 4:
            return (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                    Hoàn tiền
                </Badge>
            );
        case 5:
            return (
                <Badge variant="default" className="bg-blue-600 text-white hover:bg-blue-700">
                    Đã xác nhận đơn hàng
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="border-gray-300 text-gray-600">
                    Không xác định
                </Badge>
            );
    }
};

const OrderDetail = ({ order }: OrderDetailProps) => {
    return (
        <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Ngày đặt hàng</p>
                    <p className="font-semibold text-gray-900">{order.orderDate}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                    <div className="mt-1">
                        {getOrderStatusBadge(order.orderStatus)}
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Họ tên</p>
                    <p className="font-semibold text-gray-900">{order.fullName}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                    <p className="font-semibold text-gray-900">{order.phoneNumber}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Địa chỉ</p>
                    <p className="font-semibold text-gray-900">
                        {order.address}
                        {order.city && `, ${order.city}`}
                    </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Ghi chú</p>
                    <p className="font-semibold text-gray-900 whitespace-pre-line">
                        {order.note || "Không có ghi chú"}
                    </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Mã giao dịch</p>
                    <p className="font-semibold text-gray-900">{order.orderCode}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Phương thức thanh toán</p>
                    <div className="mt-1">
                        <Badge variant="outline">
                            {getPaymentMethodLabel(order.paymentMethod)}
                        </Badge>
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                    <p className="text-sm text-purple-600 mb-1">Tổng tiền</p>
                    <p className="font-bold text-lg text-purple-700">
                        {order.totalAmount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                    </p>
                </div>
            </div>

            {/* Order Items */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm trong đơn</h3>
                <div className="space-y-3">
                    {order.menus?.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 rounded-lg bg-white border border-gray-100"
                        >
                            <div className="relative h-16 w-16 overflow-hidden rounded-lg border flex-shrink-0">
                                <Image
                                    src={item.menuImage}
                                    alt={item.menuName}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900">{item.menuName}</p>
                                <p className="text-sm text-gray-600">
                                    Số lượng: {item.quantity} × {item.unitPrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-purple-700">
                                    {(item.quantity * item.unitPrice).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;

