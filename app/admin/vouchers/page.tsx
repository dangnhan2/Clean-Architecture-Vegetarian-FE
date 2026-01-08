"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import VoucherDetail from "@/components/admin/vouchers/VoucherDetail";
import VoucherCreatingForm from "@/components/admin/vouchers/VoucherCreatingForm";
import VoucherEditingForm from "@/components/admin/vouchers/VoucherEditingForm";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { DeleteVoucher, GetVouchersAdmin } from "@/services/api";
import { toast } from "sonner";
import PaginationControl from "@/components/common/PaginationControl";


const AdminVouchersPage = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedVoucher, setSelectedVoucher] = useState<IVoucher | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [voucherToDelete, setVoucherToDelete] = useState<IVoucher | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [voucherToEdit, setVoucherToEdit] = useState<IVoucher | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [vouchers, setVouchers] = useState<IVoucher[] |null | undefined>();
    const [isDeleting, setIsDeleting] = useState(false);

    // Format date from datetime-local (YYYY-MM-DDTHH:mm) to API format (MM/DD/YYYY HH:mm:ss)
    const formatDateForAPI = (dateString: string): string => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    };

    const fetchVouchers = async () => {
        let query = `page=${page}&pageSize=${pageSize}`

        if (searchText.trim()) {
            query += `&search=${encodeURIComponent(searchText.trim())}`;
        }

        if (startDate) {
            const formattedStartDate = formatDateForAPI(startDate);
            if (formattedStartDate) {
                query += `&startDate=${encodeURIComponent(formattedStartDate)}`;
            }
        }

        if (endDate) {
            const formattedEndDate = formatDateForAPI(endDate);
            if (formattedEndDate) {
                query += `&endDate=${encodeURIComponent(formattedEndDate)}`;
            }
        }

        let res = await GetVouchersAdmin(query);
        if (res.isSuccess && Number(res.statusCode) === 200) {
            if (res?.data) {
                setVouchers(res.data.data);
                setTotal(res.data.total || 0);
            }
        }
    }

    useEffect(() => {
        fetchVouchers();
    }, [page, pageSize, searchText, startDate, endDate]);

    const handleViewVoucher = (voucher: IVoucher) => {
        setSelectedVoucher(voucher);
        setIsDetailDialogOpen(true);
    };

    const handleDeleteClick = (voucher: IVoucher) => {
        setVoucherToDelete(voucher);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!voucherToDelete?.id) return;
        setIsDeleting(true);
        try {
            const res = await DeleteVoucher(voucherToDelete.id);
            if (res.isSuccess && Number(res.statusCode) === 200) {
                toast.success("Xóa voucher thành công");
                setIsDeleteDialogOpen(false);
                setVoucherToDelete(null);
                fetchVouchers();
            } else {
                toast.error(res.message || "Không thể xóa voucher");
            }
        } catch (error) {
            console.error("Error deleting voucher:", error);
            toast.error("Đã xảy ra lỗi khi xóa voucher");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (voucher: IVoucher) => {
        setVoucherToEdit(voucher);
        setIsEditDialogOpen(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10">
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-purple-700">Quản Lý Voucher</h1>
                    <p className="text-gray-600">Thiết kế tương tự trang quản lý món ăn với đầy đủ thông tin voucher.</p>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                            <div className="w-full sm:w-80">
                                <Input
                                    placeholder="Tìm kiếm mã voucher..."
                                    className="bg-white"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 flex-1">
                                <div className="flex-1">
                                    <Input
                                        type="datetime-local"
                                        placeholder="Ngày bắt đầu"
                                        className="bg-white"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        type="datetime-local"
                                        placeholder="Ngày kết thúc"
                                        className="bg-white"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <Button
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow whitespace-nowrap"
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            + Thêm Voucher
                        </Button>
                    </div>
                    {(searchText || startDate || endDate) && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchText("");
                                    setStartDate("");
                                    setEndDate("");
                                }}
                                className="text-xs"
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>
                    )}
                </div>

                <Card className="shadow-sm border border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-800">Danh Sách Voucher</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 overflow-x-auto">
                        <div className="min-w-[900px]">
                            <div className="grid grid-cols-[1.2fr_1.4fr_1.4fr_1.2fr_1.2fr_1.1fr_1.1fr_1fr] gap-3 px-4 py-3 text-sm font-semibold text-gray-500 border-b bg-white">
                                <span className="text-left">Mã</span>
                                <span className="text-center">Giá trị</span>
                                <span className="text-center">Giảm tối đa</span>
                                <span className="text-center">Bắt đầu</span>
                                <span className="text-center">Kết thúc</span>
                                <span className="text-center">Giới hạn</span>
                                <span className="text-center">Trạng thái</span>
                                <span className="text-right">Hành động</span>
                            </div>

                            <div className="divide-y">
                                {vouchers?.map((voucher) => (
                                    <div
                                        key={voucher.id}
                                        className="grid grid-cols-[1.2fr_1.4fr_1.4fr_1.2fr_1.2fr_1.1fr_1.1fr_1fr] gap-3 px-4 py-4 items-center bg-white hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        <div className="font-semibold text-gray-900">{voucher.code}</div>
                                        <div className="flex flex-col items-center gap-1">
                                            <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                                                {voucher.discountType === "percent"
                                                    ? `${voucher.discountValue}%`
                                                    : `${voucher.discountValue.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}`}
                                            </Badge>
                                        </div>
                                        <div className="text-center font-semibold text-gray-800">
                                            {voucher.maxDiscount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                        </div>
                                        <div className="text-center text-gray-800 text-xs">{voucher.startDate}</div>
                                        <div className="text-center text-gray-800 text-xs">{voucher.endDate}</div>
                                        <div className="text-center text-gray-800">{voucher.usageLimit}</div>
                                        <div className="flex items-center justify-center">
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
                                        <div className="flex items-center gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                                onClick={() => handleViewVoucher(voucher)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-700 hover:bg-gray-100"
                                                onClick={() => handleEditClick(voucher)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="bg-red-500 hover:bg-red-600"
                                                onClick={() => handleDeleteClick(voucher)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>

                    <PaginationControl
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={setPage}
                        className="mt-8"
                    />
                </Card>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Thêm Voucher Mới</DialogTitle>
                            <DialogDescription>
                                Nhập thông tin voucher và lưu để áp dụng.
                            </DialogDescription>
                        </DialogHeader>
                        <VoucherCreatingForm
                            onSuccess={() => {
                                setIsCreateDialogOpen(false);
                                fetchVouchers();
                            }}
                            onCancel={() => setIsCreateDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Chi Tiết Voucher</DialogTitle>
                        </DialogHeader>
                        {selectedVoucher ? (
                            <VoucherDetail voucher={selectedVoucher} />
                        ) : (
                            <DialogDescription>Không tìm thấy thông tin voucher.</DialogDescription>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa voucher</DialogTitle>
                            <DialogDescription>
                                Bạn có chắc chắn muốn xóa voucher <strong>{voucherToDelete?.code}</strong>? Hành động này không thể hoàn tác.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                                Hủy
                            </Button>
                            <Button
                                variant="destructive"
                                className="bg-red-500 hover:bg-red-600"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Đang xóa..." : "Xóa"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa Voucher</DialogTitle>
                            <DialogDescription>
                                Cập nhật thông tin voucher và lưu thay đổi.
                            </DialogDescription>
                        </DialogHeader>
                        <VoucherEditingForm
                            voucher={voucherToEdit}
                            onSuccess={() => {
                                setIsEditDialogOpen(false);
                                fetchVouchers();
                            }}
                            onCancel={() => setIsEditDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminVouchersPage;