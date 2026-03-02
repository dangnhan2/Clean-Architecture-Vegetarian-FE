"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Clock, Star, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PaginationControl from "@/components/common/PaginationControl";
import { useAuth } from "@/context/context";
import { CancelOrder, GetOrdersByUser, RatingMenu } from "@/services/api";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { GetBanks } from "@/services/external_api";

// Map order status number to display text and badge variant
const getOrderStatus = (status: number): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
  switch (status) {
    case 1:
      // Đã thanh toán: màu nổi bật (primary)
      return { text: "Đã thanh toán", variant: "default" };
    case 2:
      // Hết hạn thanh toán: đỏ cảnh báo
      return { text: "Hết hạn thanh toán", variant: "destructive" };
    case 3:
      // Đã hủy: viền xám trung tính
      return { text: "Đã hủy", variant: "outline" };
    case 4:
      // Hoàn tiền: màu phụ, không quá cảnh báo
      return { text: "Hoàn tiền", variant: "secondary" };
    case 5:
      // Đã xác nhận: cũng là trạng thái tốt, dùng primary
      return { text: "Đã xác nhận đơn hàng", variant: "default" };
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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IItemHistory | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<IOrderHistory | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  // Danh sách ngân hàng nhận về từ API bên thứ 3
  const [banks, setBanks] = useState<IBankData[]>([]);
  const [selectedBankBin, setSelectedBankBin] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

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
  }, [user?.id, page, pageSize]);

  const isQrPayment = (method: number | string | undefined | null) => {
    if (method === 1 || method === "1") return true;
    if (typeof method === "string") {
      return method.toUpperCase() === "QR";
    }
    return false;
  };

  const canCancelOrder = (order: IOrderHistory) => {
    if (!order) return false;
    // Chỉ cho hủy nếu đơn hàng đang ở trạng thái 1
    return order.orderStatus === 1;
  };

  const fetchBanks = async () => {
    try {
      const result = await GetBanks();
      // result.data có dạng: IBank = { code: string; desc: string; data: IBankData[] }
      const bankResponse = result.data as IBank;
      const list = bankResponse.data;
      if (Array.isArray(list)) {
        setBanks(list);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
      toast.error("Không thể tải danh sách ngân hàng");
    }
  };

  const openCancelModal = async (order: IOrderHistory) => {
    setOrderToCancel(order);
    setCancelReason("");
    setSelectedBankBin("");
    setBankAccountNumber("");

    // Nếu thanh toán QR thì cần lấy danh sách ngân hàng để chọn bank hoàn tiền
    if (isQrPayment(order.paymentMethod)) {
      if (banks.length === 0) {
        await fetchBanks();
      }
    }

    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setIsCancelModalOpen(false);
    setOrderToCancel(null);
    setCancelReason("");
    setSelectedBankBin("");
    setBankAccountNumber("");
    setIsCancelling(false);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel || !user?.id) return;

    const isQr = isQrPayment(orderToCancel.paymentMethod);

    if (isQr) {
      if (!selectedBankBin) {
        toast.error("Vui lòng chọn ngân hàng để hoàn tiền");
        return;
      }
      if (!bankAccountNumber.trim()) {
        toast.error("Vui lòng nhập số tài khoản ngân hàng");
        return;
      }
    }

    setIsCancelling(true);
    try {
      const paymentMethodValue = isQr ? 1 : 0;

      const res = await CancelOrder(
        orderToCancel.id,
        user.id,
        cancelReason || "Người dùng yêu cầu hủy đơn hàng",
        paymentMethodValue,
        isQr ? selectedBankBin : "",
        isQr ? bankAccountNumber.trim() : ""
      );

      if (res.isSuccess && Number(res.statusCode) === 200) {
        toast.success(res.message || "Hủy đơn hàng thành công");
        closeCancelModal();

        // Refresh orders list
        if (user?.id) {
          const query = `page=${page}&pageSize=${pageSize}`;
          const refreshRes = await GetOrdersByUser(user.id, query);
          if (refreshRes.isSuccess && Number(refreshRes.statusCode) === 200 && refreshRes.data) {
            setOrders(refreshRes.data.data);
            setTotal(refreshRes.data.total || 0);
          }
        }
      } else {
        toast.error(res.message || "Không thể hủy đơn hàng. Vui lòng thử lại");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Không thể hủy đơn hàng. Vui lòng thử lại");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOrderAgain = (menuId: string) => {
    router.push(`/product/${menuId}`);
  };

  const resetReviewForm = () => {
    setReviewStars(0);
    setReviewComment("");
    setReviewImages([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setIsSubmittingReview(false);
  };

  const openReviewModal = (orderId: string, item: IItemHistory) => {
    resetReviewForm();
    setSelectedItem(item);
    setSelectedOrderId(orderId);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    resetReviewForm();
    setSelectedItem(null);
    setSelectedOrderId(null);
    setIsReviewModalOpen(false);
  };

  const handleReviewImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length || reviewImages.length >= 3) return;

    const availableSlots = 3 - reviewImages.length;
    const selectedFiles = files.slice(0, availableSlots);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));

    setReviewImages((prev) => [...prev, ...selectedFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    event.target.value = "";
  };

  const handleRemovePreview = (index: number) => {
    setReviewImages((prev) => prev.filter((_, idx) => idx !== index));
    setPreviewUrls((prev) => {
      const urlToRemove = prev[index];
      if (urlToRemove) URL.revokeObjectURL(urlToRemove);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSubmitReview = async () => {
    if (!selectedItem || !selectedOrderId) return;
    if (!user?.id) {
      toast.error("Bạn cần đăng nhập để đánh giá");
      return;
    }
    if (reviewStars === 0) {
      toast.error("Vui lòng chọn số sao");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await RatingMenu(
        selectedItem.menuId,
        selectedOrderId,
        user.id,
        user.userName,
        reviewStars,
        reviewComment,
        reviewImages
      );

      if (res.isSuccess && Number(res.statusCode) === 201) {
        toast.success(res.message || "Đã gửi đánh giá. Cảm ơn bạn!");
        closeReviewModal();
        // Refresh orders to update isRated status
        if (user?.id) {
          const query = `page=${page}&pageSize=${pageSize}`;
          const refreshRes = await GetOrdersByUser(user.id, query);
          if (refreshRes.isSuccess && Number(refreshRes.statusCode) === 200 && refreshRes.data) {
            setOrders(refreshRes.data.data);
            setTotal(refreshRes.data.total || 0);
          }
        }
      } else {
        toast.error(res.message || "Không thể gửi đánh giá. Vui lòng thử lại");
      }
    } catch (error) {
      console.error("Error submitting review", error);
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại");
    } finally {
      setIsSubmittingReview(false);
    }
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
                const canReview = order.orderStatus === 1 || order.orderStatus === 3;
                const canCancel = canCancelOrder(order);
                const isQr = isQrPayment(order.paymentMethod);
                return (
                  <Card key={order.id} className="shadow-lg border border-gray-100">
                    <CardContent className="p-6">
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-lg font-semibold text-gray-900">
                              Đơn hàng #{order.orderCode}
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
                          {canCancel && (
                            <p className="text-xs text-red-500 mt-1">
                              Lưu ý: Bạn chỉ có thể hủy khi đơn hàng đang ở trạng thái &quot;Đã thanh toán&quot;.
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-0 md:ml-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                            <p className="text-lg font-bold text-gray-900">
                              {order.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                            </p>
                          </div>
                          {canCancel && (
                            <Button
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 text-sm"
                              onClick={() => openCancelModal(order)}
                            >
                              Hủy đơn hàng
                            </Button>
                          )}
                          {!canCancel && order.orderStatus !== 2 && (
                            <p className="text-xs text-gray-400 max-w-xs text-right">
                              Đơn hàng chỉ có thể hủy khi đang ở trạng thái &quot;Đã thanh toán&quot;.
                            </p>
                          )}
                          {order.orderStatus === 2 && (
                            <p className="text-xs text-red-500">Đơn hàng đã được hủy.</p>
                          )}
                          {isQr && (
                            <p className="text-xs text-gray-500">
                              Phương thức thanh toán: QR
                            </p>
                          )}
                          {!isQr && (
                            <p className="text-xs text-gray-500">
                              Phương thức thanh toán: {order.paymentMethod === 0 ? "COD" : order.paymentMethod}
                            </p>
                          )}
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
                              <div className="flex-shrink-0 flex flex-col gap-2">
                                {canReview && (
                                  item.isRated ? (
                                    <div className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md text-center">
                                      Đã đánh giá
                                    </div>
                                  ) : (
                                    <Button
                                      className="bg-amber-500 text-white hover:bg-amber-600 border-transparent"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openReviewModal(order.id, item);
                                      }}
                                    >
                                      Đánh giá
                                    </Button>
                                  )
                                )}
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

      {/* Cancel Order Modal */}
      <Dialog
        open={isCancelModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCancelModal();
          } else {
            setIsCancelModalOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Hủy đơn hàng</DialogTitle>
            <DialogDescription>
              Đơn hàng chỉ có thể được hủy khi đang ở trạng thái <strong>Đã thanh toán</strong>. Vui lòng kiểm tra kỹ trước khi xác nhận.
            </DialogDescription>
          </DialogHeader>

          {orderToCancel && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Đơn hàng #{orderToCancel.orderCode}
                </p>
                <p className="text-xs text-gray-500">
                  Thời gian đặt: {formatDate(orderToCancel.orderDate)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tổng tiền:{" "}
                  <span className="font-semibold text-gray-900">
                    {orderToCancel.totalAmount.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    })}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Lý do hủy đơn hàng (không bắt buộc)</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn..."
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              {isQrPayment(orderToCancel.paymentMethod) && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="refund-amount">Số tiền hoàn (tự động theo đơn hàng)</Label>
                    <Input
                      id="refund-amount"
                      type="text"
                      value={orderToCancel.totalAmount.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                      disabled
                      readOnly
                    />
                    <p className="text-xs text-gray-500">
                      Số tiền hoàn được lấy theo tổng tiền của đơn hàng và không thể chỉnh sửa.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Ngân hàng nhận hoàn tiền</Label>
                    <Select value={selectedBankBin} onValueChange={setSelectedBankBin}>
                      <SelectTrigger className="w-full max-w-full">
                        <SelectValue placeholder="-- Chọn ngân hàng --" />
                      </SelectTrigger>
                      <SelectContent
                        className="w-[var(--radix-select-trigger-width)] max-h-60 sm:max-h-72 overflow-y-auto"
                      >
                        {banks.map((bank) => (
                          <SelectItem
                            key={bank.id}
                            value={bank.bin}
                            className="whitespace-normal text-sm"
                          >
                            {bank.shortName} - {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-account-number">Số tài khoản ngân hàng</Label>
                    <Input
                      id="bank-account-number"
                      type="text"
                      placeholder="Nhập số tài khoản để nhận tiền hoàn"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Lưu ý: Tiền hoàn sẽ được chuyển về tài khoản ngân hàng bạn cung cấp ở trên.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="space-y-2 sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeCancelModal}
              disabled={isCancelling}
            >
              Đóng
            </Button>
            <Button
              type="button"
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleConfirmCancel}
              disabled={isCancelling || !orderToCancel || !canCancelOrder(orderToCancel)}
            >
              {isCancelling ? "Đang hủy..." : "Xác nhận hủy đơn hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isReviewModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeReviewModal();
          } else {
            setIsReviewModalOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Đánh giá món ăn</DialogTitle>
            <DialogDescription>
              Chia sẻ trải nghiệm của bạn để mọi người cùng tham khảo.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                <Image
                  src={selectedItem.menuImage}
                  alt={selectedItem.menuName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{selectedItem.menuName}</p>
                <p className="text-sm text-gray-500">Số lượng: {selectedItem.quantity}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Số sao</Label>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const value = idx + 1;
                  const isActive = value <= reviewStars;
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant="outline"
                      className={`h-11 w-11 rounded-full border-2 ${isActive ? "border-amber-400 bg-amber-50 text-amber-500" : "border-gray-200 text-gray-400"}`}
                      onClick={() => setReviewStars(value)}
                    >
                      <Star className={`h-5 w-5 ${isActive ? "fill-amber-400 text-amber-500" : ""}`} />
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment">Bình luận</Label>
              <Textarea
                id="review-comment"
                placeholder="Món ăn có ngon không? Hãy chia sẻ cảm nhận của bạn..."
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">{reviewComment.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-images">Hình ảnh (tối đa 3 ảnh)</Label>
              <Input
                id="review-images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleReviewImagesChange}
                disabled={reviewImages.length >= 3}
              />
              <p className="text-xs text-gray-500">
                Chọn những bức ảnh ngon nhất của món ăn để minh họa.
              </p>
              {previewUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {previewUrls.map((url, idx) => (
                    <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Ảnh đánh giá ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                        onClick={() => handleRemovePreview(idx)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="space-y-2 sm:space-y-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeReviewModal}
              disabled={isSubmittingReview}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="bg-amber-500 text-white hover:bg-amber-600"
              onClick={handleSubmitReview}
              disabled={isSubmittingReview || reviewStars === 0}
            >
              {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const OrderHistoryPageWrapper = () => {
  return (
    <ProtectedRoute>
      <OrderHistoryPage />
    </ProtectedRoute>
  );
};

export default OrderHistoryPageWrapper;

