"use client";

import { Badge } from "@/components/ui/badge";

const VoucherDetail = ({ voucher }: { voucher: IVoucher }) => {
    return (
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">ID</p>
                <p>{voucher.id}</p>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">Mã</p>
                <p>{voucher.code}</p>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">Mô tả</p>
                <p>{voucher.description}</p>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">Loại giảm</p>
                <p>{voucher.discountType}</p>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">Giá trị</p>
                <p>
                    {voucher.discountType === "percent"
                        ? `${voucher.discountValue}%`
                        : `${voucher.discountValue.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}`}
                </p>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">Giảm tối đa</p>
                <p>{voucher.maxDiscount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</p>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">Đơn tối thiểu</p>
                <p>{voucher.minOrderAmount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</p>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">Thời gian</p>
                <p>{voucher.startDate} - {voucher.endDate}</p>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">Đã dùng / Giới hạn </p>
                <p>{voucher.usedCount} / {voucher.usageLimit}</p>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">Giới hạn mỗi user</p>
                <p>{voucher.perUserLimit}</p>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-gray-900">Trạng thái</p>
                <Badge
                    variant={voucher.isActive ? "default" : "secondary"}
                    className={
                        voucher.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                    }
                >
                    {voucher.isActive ? "Đang áp dụng" : "Ngừng áp dụng"}
                </Badge>
            </div>
        </div>
    );
};

export default VoucherDetail;