"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface ReviewCardProps {
  review: IRating;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
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

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-3 md:p-4 lg:p-5 space-y-3 md:space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-sm md:text-base font-semibold text-gray-900">
              {review.fullName}
            </p>
          </div>
          <div className="flex items-center gap-0.5 md:gap-1">{renderStars(review.stars)}</div>
        </div>

        {review.comment && (
          <p className="text-xs md:text-sm text-gray-700 leading-relaxed">{review.comment}</p>
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
      </CardContent>
    </Card>
  );
};

export default ReviewCard;

