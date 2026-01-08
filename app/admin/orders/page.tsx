"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { GetOrdersAdmin } from "@/services/api";
import { useEffect, useState } from "react";
import PaginationControl from "@/components/common/PaginationControl";
import { toast } from "sonner";
import OrderDetail from "@/components/admin/orders/OrderDetail";


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

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState<IOrderHistory[] | null | undefined>();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [selectedOrder, setSelectedOrder] = useState<IOrderHistory | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [searchText, setSearchText] = useState("");

    const fetchOrders = async () => {
        let query = `page=${page}&pageSize=${pageSize}`;
        if (searchText) {
            query += `&search=${encodeURIComponent(searchText)}`;
        }

        try {
            const res = await GetOrdersAdmin(query);
            if (res.isSuccess && Number(res.statusCode) === 200) {
                if (res?.data) {
                    setOrders(res.data.data);
                    setTotal(res.data.total || 0);
                }
            } else {
                toast.error(res.message || "Không thể tải danh sách đơn hàng");
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Đã xảy ra lỗi khi tải danh sách đơn hàng");
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, pageSize, searchText]);

    const handleViewOrder = (order: IOrderHistory) => {
        setSelectedOrder(order);
        setIsDetailDialogOpen(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10">
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-purple-700">Quản Lý Đơn Hàng</h1>
                </div>


                {/* Table */}
                <Card className="shadow-sm border border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-800">Danh Sách Đơn Hàng</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 overflow-x-auto">
                        <div className="min-w-[1300px]">
                            <div className="grid grid-cols-[0.8fr_1.2fr_1fr_1.5fr_1.2fr_1.2fr_1fr_1fr_0.8fr] gap-3 px-4 py-3 text-sm font-semibold text-gray-500 border-b bg-white">
                                <span className="text-left">Mã đơn</span>
                                <span className="text-left">Ngày đặt</span>
                                <span className="text-left">Họ tên</span>
                                <span className="text-left">Số điện thoại</span>
                                <span className="text-left">Địa chỉ</span>
                                <span className="text-left">Ghi chú</span>
                                <span className="text-center">Trạng thái</span>
                                <span className="text-right">Tổng tiền</span>
                                <span className="text-right">Hành động</span>
                            </div>

                            <div className="divide-y">
                                {orders?.map((order) => (
                                    <div
                                        key={order.id}
                                        className="grid grid-cols-[0.8fr_1.2fr_1fr_1.5fr_1.2fr_1.2fr_1fr_1fr_0.8fr] gap-3 px-4 py-4 items-center bg-white hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        <div className="text-gray-900 font-semibold">#{order.id.slice(0, 8)}</div>
                                        <div className="text-gray-700">{order.orderDate}</div>
                                        <div className="font-semibold text-gray-900">{order.fullName}</div>
                                        <div className="text-gray-700">{order.phoneNumber}</div>
                                        <div className="text-gray-700 line-clamp-2">{order.address}</div>
                                        <div className="text-gray-700 line-clamp-2">
                                            {order.note || "--"}
                                        </div>
                                        <div className="flex items-center justify-center">
                                            {getOrderStatusBadge(order.orderStatus)}
                                        </div>
                                        <div className="text-purple-700 font-semibold text-right tabular-nums">
                                            {order.totalAmount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                                onClick={() => handleViewOrder(order)}
                                                disabled={isLoadingDetail}
                                            >
                                                <Eye className="h-4 w-4" />
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

                {/* Order Detail Dialog */}
                <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Chi Tiết Đơn Hàng</DialogTitle>                           
                        </DialogHeader>
                        {selectedOrder && (
                            <OrderDetail order={selectedOrder} />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminOrdersPage;

