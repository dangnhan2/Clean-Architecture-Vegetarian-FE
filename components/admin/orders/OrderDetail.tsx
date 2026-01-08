"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface OrderDetailProps {
    order: IOrderHistory;
}

const getOrderStatusBadge = (status: number) => {
    if (status === 1) {
        return (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                Hoàn thành
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
            Đang xử lý
        </Badge>
    );
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
                    <p className="font-semibold text-gray-900">{order.address}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Ghi chú</p>
                    <p className="font-semibold text-gray-900 whitespace-pre-line">
                        {order.note || "Không có ghi chú"}
                    </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Mã giao dịch</p>
                    <p className="font-semibold text-gray-900">{order.transactionCode || "--"}</p>
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
                                    Số lượng: {item.quantity} × {item.subPrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-purple-700">
                                    {(item.quantity * item.subPrice).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
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

