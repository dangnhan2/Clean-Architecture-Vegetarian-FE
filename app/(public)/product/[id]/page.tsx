"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProductReviewsSection } from "@/components/product/reviews";
import { GetFoodItemById, AddToCart, GetRecommendedFoodItems } from "@/services/api";
import { useAuth } from "@/context/context";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const ProductDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, fetchCart } = useAuth();
  const [product, setProduct] = useState<IFoodItem | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<IFoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value: number | null | undefined) =>
    typeof value === "number"
      ? value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
      : "--";

  const getEffectivePrice = (item: IFoodItem) =>
    item.isOnSale ? item.discountPrice : item.originalPrice;

  const formatRating = (value: number | null | undefined) =>
    typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "0.0";

  const getDiscountPercent = (item: IFoodItem) => {
    if (!item.isOnSale || !item.originalPrice) return null;
    const percent = 100 - (item.discountPrice / item.originalPrice) * 100;
    return Math.max(1, Math.round(percent));
  };

  const getDiscountLabel = (item: IFoodItem) => {
    const percent = getDiscountPercent(item);
    return percent ? `Giảm ${percent}%` : "Giảm giá";
  };

  useEffect(() => {
    fetchRecommendedProducts(params?.id as string)
  }, [params?.id, router]);

  const fetchRecommendedProducts = async (productId: string) => {
    try {
      setIsLoading(true);
      const res = await GetRecommendedFoodItems(productId);
      if (res.isSuccess && Number(res.statusCode) === 200 && res.data) {
        setRecommendedProducts(res.data);
      } else {
        setRecommendedProducts([]);
      }
    } catch (error) {
      console.error("Error fetching recommended products:", error);
      setRecommendedProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user?.id) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      router.push("/auth/login");
      return;
    }

    if (!product) return;
    if (!product.isAvailable) {
      toast.error("Sản phẩm tạm hết hàng");
      return;
    }

    const cartItems: ICartItemRequest[] = [
      { menuId: product.id, quantity: 1, unitPrice: getEffectivePrice(product) }
    ];

    try {
      const res = await AddToCart(user.id, cartItems);
      if (res.isSuccess && Number(res.statusCode) === 201) {
        toast.success(res.message || "Đã thêm vào giỏ hàng");
        fetchCart();
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng");
    }
  };

  const fetchProductDetail = async (productId: string) => {
    try {
      const res = await GetFoodItemById(productId);
      if (res.isSuccess && Number(res.statusCode) === 200 && res.data) {
        setProduct(res.data);
      }
    } catch (error) {
      console.error("Error fetching product detail:", error);
      toast.error("Có lỗi xảy ra khi tải sản phẩm");
    }
  }

  useEffect(() => {
    fetchProductDetail(params?.id as string);
  }, [params?.id]);

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">
        {/* Back to Menu Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>Trở về menu</span>
        </Link>

        {/* Product Detail Layout - 2 Columns */}
        <Card>
          <CardContent className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column - Product Image */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {product?.isOnSale && (
                    <Badge className="bg-red-500 text-white hover:bg-red-500/90">
                      {product ? getDiscountLabel(product) : "Giảm giá"}
                    </Badge>
                  )}
                  {!product?.isAvailable && (
                    <Badge className="bg-gray-900/80 text-white hover:bg-gray-900/90">
                      Tạm hết
                    </Badge>
                  )}
                </div>
                <Image
                  src={product?.imageUrl || "/HapplyFoodLogo.jpg"}
                  alt={product?.name || "Hình ảnh món ăn"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Right Column - Product Details */}
              <div className="flex flex-col space-y-6">

                {/* Product Title */}
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  {product?.name}
                </h1>

                {/* Rating & Sales */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">
                      {formatRating(product?.averageRating)}
                    </span>
                    <span className="text-gray-500">
                      ({product?.ratingCount ?? 0} đánh giá)
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {product?.soldQuantity ?? 0} đã bán
                  </span>
                </div>

                {/* Separator */}
                <div className="border-t border-gray-200"></div>

                {/* Description Section */}
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-gray-900">Mô tả</h2>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {product?.description || ""}
                  </p>
                </div>

                {/* Category Section */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-gray-900">Danh mục</h2>
                      <Badge variant="secondary" className="w-fit">
                        {product?.category || ""}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Separator */}
                <div className="border-t border-gray-200"></div>

                {/* Price Section */}
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-gray-900">Giá</h2>
                  <div className="flex items-end gap-3">
                    <p className="text-3xl font-bold text-gray-900">
                      {product ? formatCurrency(getEffectivePrice(product)) : "--"}
                    </p>
                    {product?.isOnSale && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          {formatCurrency(product?.originalPrice)}
                        </span>
                        <Badge className="bg-red-500 text-white">
                          {product && getDiscountPercent(product)
                            ? `-${getDiscountPercent(product)}%`
                            : "Giảm giá"}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-gray-900 text-white hover:bg-gray-800 h-12 text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!product?.isAvailable}
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  {product?.isAvailable ? "Thêm vào giỏ hàng" : "Hết hàng"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        {product?.id && (
          <div className="mt-12 mb-12" id="reviews">
            <ProductReviewsSection
              menuId={product.id}
            />
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 mb-8"></div>

        {/* You May Also Like Section */}
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
            Có thể bạn cũng thích
          </h2>
          
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden shadow-md">
                  <div className="relative aspect-[4/3] bg-gray-200 animate-pulse" />
                  <CardHeader className="px-5 py-4">
                    <div className="h-5 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-3" />
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-24" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Products List */}
          {!isLoading && recommendedProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedProducts.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/product/${item.id}`)}
                >
                  {/* Image Section */}
                  <div className="relative aspect-[4/3]">
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      {item.isOnSale && (
                        <Badge className="bg-red-500 text-white hover:bg-red-500/90">
                          Giảm giá
                        </Badge>
                      )}
                      {!item.isAvailable && (
                        <Badge className="bg-gray-900/80 text-white hover:bg-gray-900/90">
                          Tạm hết
                        </Badge>
                      )}
                    </div>
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  </div>

                  {/* Content Section */}
                  <CardHeader className="px-5 py-4">
                    <CardTitle className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {item.name || ""}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2">
                      {item.description || ""}
                    </CardDescription>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">
                          {formatRating(item.averageRating)}
                        </span>
                        <span className="text-gray-500">
                          ({item.ratingCount ?? 0})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {item.soldQuantity || 0} đã bán
                      </p>
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(getEffectivePrice(item))}
                        </span>
                        {item.isOnSale && (
                          <span className="text-xs text-gray-500 line-through">
                            {formatCurrency(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && recommendedProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có sản phẩm tương tự</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
