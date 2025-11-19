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
          className={`h-4 w-4 ${
            filled ? "fill-amber-400 text-amber-400" : "text-gray-300"
          }`}
        />
      );
    });

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-gray-900">
              {review.fullName}
            </p>
          </div>
          <div className="flex items-center gap-1">{renderStars(review.stars)}</div>
        </div>

        {review.comment && (
          <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
        )}

        {review.images?.length ? (
          <div className="flex flex-wrap gap-2">
            {review.images.map((img, idx) => (
              <div
                key={img + idx}
                className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden border border-gray-100 bg-gray-50"
              >
                <Image
                  src={img}
                  alt={`Hình ảnh đánh giá ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
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

