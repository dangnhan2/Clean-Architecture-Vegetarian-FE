"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PaginationControl from "@/components/common/PaginationControl";
import { GetRatingsByMenu } from "@/services/api";
import ReviewCard from "./ReviewCard";

interface ProductReviewsSectionProps {
  menuId: string;
}

const PAGE_SIZE = 10;

const ProductReviewsSection = ({ menuId }: ProductReviewsSectionProps) => {
  const [reviews, setReviews] = useState<IRating[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [menuId]);

  useEffect(() => {
    if (!menuId) return;

    let isSubscribed = true;

    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const query = `page=${page}&pageSize=${PAGE_SIZE}`;
        const res = await GetRatingsByMenu(menuId, query);
        
        if (!isSubscribed) {
          setIsLoading(false);
          return;
        }

        setIsLoading(false);

        if (res.isSuccess && res.data) {
          setReviews(res.data.data ?? []);
          setTotal(res.data.total ?? 0);
        } else {
          setReviews([]);
          setTotal(0);
          setError(res.message || "Không thể tải đánh giá");
        }
      } catch (err) {
        if (!isSubscribed) {
          setIsLoading(false);
          return;
        }
        console.error("Error fetching reviews", err);
        setIsLoading(false);
        setReviews([]);
        setTotal(0);
        setError("Không thể tải đánh giá");
      } 
    };

    fetchReviews();

    return () => {
      isSubscribed = false;
    };
  }, [menuId, page]);

  return (
    <section className="space-y-4 md:space-y-6">
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="flex flex-col gap-2 p-4 md:p-6">
          <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
            Đánh giá từ khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 md:py-12 text-gray-500">
              <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-gray-400" />
              <p className="mt-2 text-xs md:text-sm">Đang tải đánh giá...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 md:p-6 text-center text-xs md:text-sm text-red-600">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white py-8 md:py-12 text-center text-xs md:text-sm text-gray-500">
              <MessageSquare className="mb-2 md:mb-3 h-5 w-5 md:h-6 md:w-6 text-gray-400" />
              Chưa có đánh giá nào cho món ăn này.
            </div>
          ) : (
            <>
              <div className="space-y-3 md:space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
              <PaginationControl
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
                className="mt-4 md:mt-6"
              />
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default ProductReviewsSection;