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
import { GetOrdersByUser, RatingMenu } from "@/services/api";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IItemHistory | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
                const isCompleted = order.orderStatus === 1;
                return (
                  <Card key={order.id} className="shadow-lg border border-gray-100">
                    <CardContent className="p-6">
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-4">
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
                              <div className="flex-shrink-0 flex flex-col gap-2">
                                {isCompleted && (
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

