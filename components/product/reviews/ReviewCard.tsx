"use client";

import { useState } from "react";
import { Star, MessageSquare, Send, Edit2, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResponseRating } from "@/services/api";
import { useAuth } from "@/context/context";
import { toast } from "sonner";

interface ReviewCardProps {
  review: IRating;
  onResponseSuccess?: () => void;
}

const ReviewCard = ({ review, onResponseSuccess }: ReviewCardProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const adminResponse = review.responseComment || null;

  const renderStars = (value: number) =>
    Array.from({ length: 5 }).map((_, idx) => {
      const filled = idx < value;
      return (
        <Star
          key={idx}
          className={`h-3 w-3 md:h-4 md:w-4 ${
            filled ? "fill-amber-400 text-amber-400" : "text-gray-300"
          }`}
        />
      );
    });

  const handleSubmitResponse = async () => {
    if (!user?.id || !responseText.trim()) {
      toast.error("Vui lòng nhập phản hồi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ResponseRating(user.id, review.id, responseText.trim());
      if (res.isSuccess && (Number(res.statusCode) === 200 || Number(res.statusCode) === 201)) {
        toast.success(res.message || "Đã gửi phản hồi thành công");
        setResponseText("");
        setIsResponding(false);
        if (onResponseSuccess) {
          onResponseSuccess();
        }
      } else {
        const errorMessage = typeof res.message === 'string' ? res.message : "Không thể gửi phản hồi";
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error submitting response:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Đã xảy ra lỗi khi gửi phản hồi";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Đã xảy ra lỗi khi gửi phản hồi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartResponding = () => {
    if (adminResponse) {
      setResponseText(adminResponse);
    }
    setIsResponding(true);
  };

  const handleCancelResponding = () => {
    setResponseText("");
    setIsResponding(false);
  };

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-3 md:p-4 lg:p-5 space-y-3 md:space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs md:text-sm text-gray-500 font-medium">Người đánh giá:</span>
              <p className="text-sm md:text-base font-semibold text-gray-900">
                {review.customerUserName || "Khách hàng"}
              </p>
              {review.ratingAt && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs md:text-sm text-gray-500">
                    {new Date(review.ratingAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-0.5 md:gap-1">{renderStars(review.stars)}</div>
          </div>
        </div>

        {review.comment && (
          <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
            {review.comment}
          </p>
        )}

        {review.images?.length ? (
          <div className="flex flex-wrap gap-2">
            {review.images.map((img, idx) => (
              <div
                key={img + idx}
                className="relative h-14 w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 rounded-lg overflow-hidden border border-gray-100 bg-gray-50"
              >
                <Image
                  src={img}
                  alt={`Hình ảnh đánh giá ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 56px, (max-width: 1024px) 64px, 80px"
                />
              </div>
            ))}
          </div>
        ) : null}

        {/* Admin Response Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Display existing response */}
          {adminResponse && !isResponding && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <span className="text-xs md:text-sm font-semibold text-purple-700">
                    Phản hồi từ quản trị viên
                    {review.adminUserName && (
                      <span className="text-purple-600 ml-1">({review.adminUserName})</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {review.responseAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(review.responseAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleStartResponding}
                      className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">{adminResponse}</p>
            </div>
          )}

          {/* Admin response form - Show when admin is responding or editing */}
          {isAdmin && isResponding && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span className="text-xs md:text-sm font-semibold text-purple-700">
                  {adminResponse ? "Chỉnh sửa phản hồi" : "Trả lời đánh giá này"}
                </span>
              </div>
              <Textarea
                placeholder="Nhập phản hồi của bạn..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="min-h-[100px] text-sm"
                maxLength={500}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">{responseText.length}/500</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelResponding}
                    disabled={isSubmitting}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitResponse}
                    disabled={isSubmitting || !responseText.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        {adminResponse ? "Cập nhật" : "Gửi phản hồi"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Show button to add response if admin and no response yet */}
          {isAdmin && !adminResponse && !isResponding && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartResponding}
              className="w-full sm:w-auto text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Trả lời đánh giá này
            </Button>
          )}
        </div>
      
      </CardContent>
    </Card>
  );
};

export default ReviewCard;

