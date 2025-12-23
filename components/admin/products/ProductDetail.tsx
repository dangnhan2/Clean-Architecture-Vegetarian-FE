"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Package, Tag, DollarSign, ShoppingCart, CheckCircle2, XCircle, Percent } from "lucide-react";

interface ProductDetailProps {
    product: IFoodItem;
}

const ProductDetail = ({ product }: ProductDetailProps) => {
    const formatCurrency = (value: number) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    const formatRating = (value: number) =>
        Number.isFinite(value) ? value.toFixed(1) : "0.0";

    const getDiscountPercent = () => {
        if (!product.isOnSale || !product.originalPrice) return 0;
        const percent = 100 - (product.discountPrice / product.originalPrice) * 100;
        return Math.max(1, Math.round(percent));
    };

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return Array.from({ length: 5 }).map((_, idx) => {
            if (idx < fullStars) {
                return <Star key={idx} className="h-5 w-5 fill-amber-400 text-amber-400" />;
            } else if (idx === fullStars && hasHalfStar) {
                return <Star key={idx} className="h-5 w-5 fill-amber-400 text-amber-400 opacity-50" />;
            } else {
                return <Star key={idx} className="h-5 w-5 text-gray-300" />;
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Main Product Card */}
            <Card className="shadow-lg border border-gray-100 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-2xl font-bold text-gray-900">{product.name}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                            <Badge
                                variant={product.isAvailable ? "default" : "secondary"}
                                className={`${product.isAvailable
                                        ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200"
                                    }`}
                            >
                                {product.isAvailable ? (
                                    <>
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Đang bán
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Ngừng bán
                                    </>
                                )}
                            </Badge>
                            {product.isOnSale && (
                                <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200">
                                    <Percent className="h-3 w-3 mr-1" />
                                    Đang khuyến mãi
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Image */}
                        <div className="space-y-4">
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    priority
                                />
                            </div>
                        </div>

                        {/* Right Column - Details */}
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                        Thông tin cơ bản
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Tag className="h-5 w-5 text-purple-600" />
                                            <div>
                                                <span className="text-sm text-gray-500">Danh mục:</span>
                                                <Badge variant="outline" className="ml-2 border-purple-200 text-purple-700 bg-purple-50">
                                                    {product.category}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                                            <div className="flex-1">
                                                <span className="text-sm text-gray-500">Mô tả:</span>
                                                <p className="mt-1 text-gray-700 leading-relaxed">
                                                    {product.description || "Không có mô tả"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                        Giá cả
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <DollarSign className="h-5 w-5 text-purple-600" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-gray-500">Giá gốc:</span>
                                                    <span className={`text-lg font-semibold ${product.isOnSale ? "line-through text-gray-400" : "text-purple-700"
                                                        }`}>
                                                        {formatCurrency(product.originalPrice)}
                                                    </span>
                                                </div>
                                                {product.isOnSale && (
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-sm text-gray-500">Giá khuyến mãi:</span>
                                                        <span className="text-2xl font-bold text-pink-600">
                                                            {formatCurrency(product.discountPrice)}
                                                        </span>
                                                        <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                                                            -{getDiscountPercent()}%
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rating & Reviews */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                        Đánh giá
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">                               
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-amber-500">
                                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                    <span className="font-semibold">
                                                        {formatRating(product.averageRating)}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        ({product.ratingCount ?? 0})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sales & Statistics */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                        Thống kê bán hàng
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <ShoppingCart className="h-5 w-5 text-purple-600" />
                                            <div>
                                                <span className="text-sm text-gray-500">Đã bán:</span>
                                                <span className="ml-2 text-lg font-semibold text-gray-900">
                                                    {product.soldQuantity.toLocaleString("vi-VN")} sản phẩm
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Info Card */}
            <Card className="shadow-sm border border-gray-100">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Thông tin chi tiết</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm font-semibold text-gray-500">ID sản phẩm:</span>
                                <p className="mt-1 text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded border">
                                    {product.id}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-gray-500">Trạng thái:</span>
                                <div className="mt-1 flex gap-2">
                                    <Badge
                                        variant={product.isAvailable ? "default" : "secondary"}
                                        className={product.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}
                                    >
                                        {product.isAvailable ? "Có sẵn" : "Không có sẵn"}
                                    </Badge>
                                    <Badge
                                        variant={product.isOnSale ? "default" : "outline"}
                                        className={product.isOnSale ? "bg-pink-100 text-pink-700" : ""}
                                    >
                                        {product.isOnSale ? "Đang giảm giá" : "Không giảm giá"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm font-semibold text-gray-500">Tổng quan:</span>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Giá trị giảm:</span>
                                        <span className="font-semibold text-pink-600">
                                            {product.isOnSale
                                                ? formatCurrency(product.originalPrice - product.discountPrice)
                                                : formatCurrency(0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProductDetail;

