"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AddToCart, GetFeaturedFoodItems, GetAdvertisements } from "@/services/api";
import { useAuth } from "@/context/context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Home() {
  const {user, fetchCart} = useAuth();
  const router = useRouter();
  const [featuredItems, setFeaturedItems] = useState<IFoodItem[] | null | undefined>();
  const [advertisements, setAdvertisements] = useState<IAdvertisement[] | null | undefined>();

  const formatCurrency = (value: number) =>
    value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const getEffectivePrice = (item: IFoodItem) =>
    item.isOnSale ? item.discountPrice : item.originalPrice;

  const formatRating = (value: number) =>
    Number.isFinite(value) ? value.toFixed(1) : "0.0";

  const fetchFeaturedItems = async () => {
    let res = await GetFeaturedFoodItems();
    if (res.isSuccess && Number(res.statusCode) === 200){
      if (res?.data){
        setFeaturedItems(res.data);
      }
    }
  }

  const fetchAdvertisements = async () => {
    try {
      let res = await GetAdvertisements();
      if (res.isSuccess && Number(res.statusCode) === 200){
        if (res?.data){
          // Filter only active advertisements and sort by priority
          const now = new Date();
          const activeAds = res.data
            .filter(ad => {
              // Check if advertisement is active
              if (!ad.isActive) return false;
              
              // Check start date (if startAt exists, it should be <= now or null)
              if (ad.startAt) {
                try {
                  const startAt = new Date(ad.startAt);
                  if (isNaN(startAt.getTime())) {
                    // Invalid date, skip this ad
                    return false;
                  }
                  // Only filter out if startAt is in the future
                  // But allow ads that haven't started yet to be shown
                  // Commented out: if (startAt > now) return false;
                } catch (e) {
                  return false;
                }
              }
              
              // Check end date (if endAt exists, it should be >= now or null)
              if (ad.endAt) {
                try {
                  const endAt = new Date(ad.endAt);
                  if (isNaN(endAt.getTime())) {
                    // Invalid date, skip this ad
                    return false;
                  }
                  // Filter out ads that have already ended
                  if (endAt < now) return false;
                } catch (e) {
                  return false;
                }
              }
              
              return true;
            });
          
          console.log("Total ads from API:", res.data.length);
          console.log("Active ads after filter:", activeAds.length);
          setAdvertisements(activeAds);
        }
      }
    } catch (error) {
      console.error("Error fetching advertisements:", error);
    }
  }

  const handleAdvertisementClick = (ad: IAdvertisement) => {
    if (!ad.targetKey) return;
    
    // Navigate based on adTargetType
    switch(ad.adTargetType) {
      case "MenuPage":
        // Navigate to product page with targetKey as product ID
        router.push(`/${ad.targetKey}`);
        break;
      case "OnSellerPage":
        // Navigate to product page (on sale products)
        router.push(`/${ad.targetKey}`);
        break;     
    }
  }

  const handleAddToCart = async (item: IFoodItem) => {
    if (!user?.id) return;
    if (!item.isAvailable) {
      toast.error("Sản phẩm tạm hết hàng");
      return;
    }
    const cartItems: ICartItemRequest[] = [
      { menuId: item.id, quantity: 1, unitPrice: getEffectivePrice(item) }
    ];
    let res =  await AddToCart(user.id, cartItems)
    if (res.isSuccess && Number(res.statusCode) === 201){
      toast.success(res.message)
      fetchCart()
    }else{
      toast.error(res.message)
    }
  }

  useEffect(() => {
    fetchFeaturedItems();
    fetchAdvertisements();
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Advertisements */}
      <div className="bg-gray-100 py-16 px-4 md:px-8 lg:px-40">
        <div className="max-w-7xl mx-auto">
          {/* Advertisements Carousel */}
          {advertisements && advertisements.length > 0 && (
            <div className="mb-8 -mx-4 md:-mx-8 lg:-mx-40">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-0">
                  {advertisements.map((ad) => (
                    <CarouselItem key={ad.id} className="pl-0 basis-full">
                      <div
                        className="relative w-full h-[250px] sm:h-[350px] md:h-[480px] lg:h-[600px] overflow-hidden rounded-lg md:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                        onClick={() => handleAdvertisementClick(ad)}
                      >
                        <Image
                          src={ad.bannerUrl}
                          alt={ad.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="100vw"
                          priority
                        />
                        {/* Gradient Overlay - Subtle */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                        
                        {/* Content Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12">
                          <div className="max-w-3xl">
                            {/* Optional: Add CTA button */}
                            <div className="flex items-center gap-2 text-white/90 group-hover:text-white transition-colors">
                              <span className="text-sm md:text-base font-medium">Khám phá ngay</span>
                              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {advertisements.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2 md:left-6 bg-white/95 hover:bg-white text-gray-900 border border-gray-300 shadow-xl h-9 w-9 md:h-11 md:w-11 backdrop-blur-sm" />
                    <CarouselNext className="right-2 md:right-6 bg-white/95 hover:bg-white text-gray-900 border border-gray-300 shadow-xl h-9 w-9 md:h-11 md:w-11 backdrop-blur-sm" />
                  </>
                )}
              </Carousel>
            </div>
          )}
        </div>
      </div>

      {/* Advertisement Section Header */}
      {advertisements && advertisements.length > 0 && (
        <div className="px-4 md:px-8 lg:px-40 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {advertisements.slice(0, 2).map((ad, index) => {
                const backgroundClasses = [
                  "bg-gradient-to-br from-green-600 to-green-700",
                  "bg-gradient-to-br from-orange-200 via-orange-100 to-amber-100"
                ];
                return (
                  <div
                    key={ad.id}
                    className="relative overflow-hidden rounded-lg md:rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
                    onClick={() => handleAdvertisementClick(ad)}
                  >
                    <div className={`relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] ${backgroundClasses[index % 2]}`}>
                      <Image
                        src={ad.bannerUrl}
                        alt={ad.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 lg:p-10">
                        <Button
                          className="bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 md:px-6 py-2 md:py-3 w-fit text-sm md:text-base"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdvertisementClick(ad);
                          }}
                        >
                          Xem ngay
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Popular Dishes Section */}
      <div className="px-4 md:px-8 lg:px-40 py-12 bg-purple-50">
        <div className="max-w-7xl mx-auto space-y-6">        
          {/* Box 2: Carousel Cards Container */}
          <Card className="bg-white shadow-md p-4 md:p-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
              Món ăn bán chạy nhất
            </h3>
            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {featuredItems?.map((item) => (
                    <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3">
                      <Card
                        className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/product/${item.id}`)}
                      >
                        {/* Image Section */}
                        <div className="relative aspect-[4/3]">
                          <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1 md:gap-2 z-10">
                            {item.isOnSale && item.discountPercent && item.discountPercent > 0 && (
                              <Badge className="bg-red-500 text-white hover:bg-red-500/90 text-xs md:text-sm">
                                -{item.discountPercent}%
                              </Badge>
                            )}
                          </div>
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 33vw"
                          />            
                        </div>

                        {/* Content Section */}
                        <CardHeader className="px-3 md:px-5 py-3 md:py-4">
                          <CardTitle className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-2 line-clamp-1">
                            {item.name}
                          </CardTitle>
                          <CardDescription className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 leading-relaxed line-clamp-2">
                            {item.description}
                          </CardDescription>
                          <div className="flex items-center justify-between text-xs md:text-sm mb-1 md:mb-2">
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="h-3 w-3 md:h-4 md:w-4 fill-amber-400 text-amber-400" />
                              <span className="font-semibold">
                                {formatRating(item.averageRating)}
                              </span>
                              <span className="text-gray-500">
                                ({item.ratingCount ?? 0})
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {item.soldQuantity} đã bán
                          </p>
                        </CardHeader>

                        {/* Footer with Price and Add Button */}
                        <CardFooter className="px-3 md:px-5 pb-3 md:pb-5 pt-0 flex items-center justify-between gap-2">
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base md:text-xl font-bold text-gray-900 truncate">
                                {formatCurrency(getEffectivePrice(item))}
                              </span>
                              {/* discountPercent badge is shown on image only (not near price) */}
                            </div>
                            {item.isOnSale && (
                              <span className="text-xs md:text-sm text-gray-500 line-through">
                                {formatCurrency(item.originalPrice)}
                              </span>
                            )}
                          </div>
                          <Button
                            className="bg-black text-white hover:bg-black/90 rounded-md px-2 md:px-4 py-1.5 md:py-2 h-8 md:h-9 flex items-center gap-1 md:gap-1.5 text-xs md:text-sm flex-shrink-0"
                            disabled={!item.isAvailable}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item);
                            }}
                          >
                            <Plus className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden sm:inline">{item.isAvailable ? "Thêm" : "Hết hàng"}</span>
                          </Button>
                        </CardFooter>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="flex -left-4 md:-left-12 bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 shadow-lg h-8 w-8 md:h-10 md:w-10" />
                <CarouselNext className="flex -right-4 md:-right-12 bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 shadow-lg h-8 w-8 md:h-10 md:w-10" />
              </Carousel>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}