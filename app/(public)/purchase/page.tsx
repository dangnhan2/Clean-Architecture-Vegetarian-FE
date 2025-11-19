"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PaginationControl from "@/components/common/PaginationControl";
import { useAuth } from "@/context/context";
import { GetOrdersByUser } from "@/services/api";
import { useRouter } from "next/navigation";

// Map order status number to display text and badge variant
const getOrderStatus = (status: number): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
  switch (status) {
    case 1:
      return { text: "Đã hoàn thành", variant: "secondary" };
    case 2:
      return { text: "Đã hủy", variant: "destructive" };
    default:
      return { text: "Không xác định", variant: "outline" };
  }
};

// Format date to display format (e.g., "Monday, November 10, 2025 at 05:02 PM")
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";

  const dateStr = date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Nếu muốn 24h
  });

  return `${dateStr} lúc ${timeStr}`;
};

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<IOrderHistory[] | null | undefined>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;

      let query = `page=${page}&pageSize=${pageSize}`;

      try {
        let res = await GetOrdersByUser(user.id, query);

        if (res.isSuccess && Number(res.statusCode) === 200 && res.data) {
          setOrders(res.data.data);
          setTotal(res.data.total || 0);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, [user?.id, page, pageSize, total]);

  const handleOrderAgain = (menuId: string) => {
    router.push(`/product/${menuId}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Trở về trang chủ</span>
        </Link>

        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Lịch sử đặt hàng</h1>

        {/* Orders List */}
        {orders?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Chưa có đơn hàng nào</p>
            <Link href="/">
              <Button className="mt-4" variant="outline">
                Bắt đầu mua hàng
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {orders?.map((order) => {
                const status = getOrderStatus(order.orderStatus);
                return (
                  <Card key={order.id} className="shadow-lg border border-gray-100">
                    <CardContent className="p-6">
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-lg font-semibold text-gray-900">
                              Đơn hàng #{order.transactionCode}
                            </h2>
                            <Badge
                              variant={status.variant}
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${status.variant === "default"
                                ? "bg-blue-600 text-white hover:bg-blue-700 border-transparent"
                                : ""
                                }`}
                            >
                              <Clock className="h-3 w-3 mr-1.5" />
                              {status.text}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(order.orderDate)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                          <p className="text-lg font-bold text-gray-900">
                            {order.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                          </p>
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="border-t border-gray-200 my-4"></div>

                      {/* Order Items */}
                      <div className="space-y-4">
                        {order.menus && order.menus.length > 0 ? (
                          order.menus.map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                              <div 
                                className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"                                                   
                              >
                                <Image
                                  src={item.menuImage}
                                  alt={item.menuName}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                              <div 
                                className="flex-1 min-w-0 cursor-pointer hover:text-gray-600 transition-colors"                                                     
                              >
                                <p className="text-base font-medium text-gray-900 mb-1">
                                  {item.menuName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Số lượng: {item.quantity}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-base font-medium text-gray-900">
                                  {item.subPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <Button
                                  variant="outline"
                                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 hover:border-gray-300 rounded-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOrderAgain(item.menuId);
                                  }}
                                >
                                  Đặt lại
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Không có món nào trong đơn hàng này
                          </p>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <PaginationControl
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              className="mt-8"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;

