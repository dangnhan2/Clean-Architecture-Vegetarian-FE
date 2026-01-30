"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [selectedStars, setSelectedStars] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setPage(1);
    setSelectedStars(null);
  }, [menuId]);

  useEffect(() => {
    if (!menuId) return;

    let isSubscribed = true;

    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let query = `page=${page}&pageSize=${PAGE_SIZE}`;
        if (selectedStars !== null) {
          query += `&stars=${selectedStars}`;
        }
        
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
  }, [menuId, page, selectedStars, refreshKey]);

  const handleStarFilter = (stars: number | null) => {
    setSelectedStars(stars);
    setPage(1);
  };

  const renderStarFilterButton = (stars: number | null, label: string) => {
    const isActive = selectedStars === stars;
    return (
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={() => handleStarFilter(stars)}
        className="flex items-center gap-1"
      >
        {stars !== null && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star
                key={idx}
                className={`h-3 w-3 ${
                  idx < stars
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        )}
        <span>{label}</span>
      </Button>
    );
  };

  return (
    <section className="space-y-4 md:space-y-6">
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="flex flex-col gap-2 p-4 md:p-6">
          <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
            Đánh giá từ khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Star Filter */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-sm md:text-base font-medium text-gray-700">
              Lọc theo:
            </span>
            {renderStarFilterButton(null, "Tất cả")}
            {renderStarFilterButton(5, "5 sao")}
            {renderStarFilterButton(4, "4 sao")}
            {renderStarFilterButton(3, "3 sao")}
            {renderStarFilterButton(2, "2 sao")}
            {renderStarFilterButton(1, "1 sao")}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>
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
                  <ReviewCard 
                    key={review.id} 
                    review={review}
                    onResponseSuccess={() => {
                      setRefreshKey(prev => prev + 1);
                    }}
                  />
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