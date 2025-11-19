"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Star } from "lucide-react";
import { AddToCart, GetCategories, GetFoodItems } from "@/services/api";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/context/context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProductPage() {
  const {user, fetchCart} = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Mặc định");
  const [categories, setCategories] = useState<ICategory[] | null | undefined>();
  const [items, setItems] = useState<IFoodItem[] | null | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (value: number) =>
    value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const getEffectivePrice = (item: IFoodItem) =>
    item.isOnSale ? item.discountPrice : item.originalPrice;

  const formatRating = (value: number) =>
    Number.isFinite(value) ? value.toFixed(1) : "0.0";

  const fetchCategories = async () => {
     let res = await GetCategories();
     if (res.isSuccess && Number(res.statusCode) === 200){
      setCategories(res?.data);
     }
  }

  const fetchFoodItems = async () => {
    let query = `page=${page}&pageSize=${pageSize}`

    if (selectedCategory && selectedCategory !== "All"){
      query += `&category=${selectedCategory}`
    }

    if (searchTerm){
      query += `&name=${encodeURIComponent(searchTerm)}`
    }

    // Map sort options to API sort parameters
    let sortParam = "";
    switch(selectedSort) {
      case "Giá: Thấp đến cao":
        sortParam = "&sortBy=price&sortOrder=asc"
        break
      case "Giá: Cao đến thấp":
        sortParam = "&sortBy=price&sortOrder=desc"
        break
      case "Bán chạy nhất":
        sortParam = "&sortBy=soldquantity&sortOrder=desc"
        break;
      case "Mặc đinh":
        sortParam = ""
        break
    }
    if (sortParam) {
      query += `${sortParam}`
    }

    let res = await GetFoodItems(query);
    // console.log(res);
    if (res.isSuccess && Number(res.statusCode) === 200){
      if (res?.data){
        setItems(res.data.data);
        setTotal(res.data.total || 0);
      }
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
    fetchFoodItems();
  }, [page, pageSize, searchTerm, selectedCategory, selectedSort]);

  useEffect(() => {
    fetchCategories();
  }, [])

  const sortOptions = [
    "Mặc định",
    "Giá: Thấp đến cao",
    "Giá: Cao đến thấp",
    "Bán chạy nhất",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gray-100 py-16 px-4 md:px-8 lg:px-40">
        <div className="max-w-7xl mx-auto">
          {/* Fast Delivery Badge */}
          <div className="mb-6">
            <Badge className="bg-black text-white hover:bg-black/90 rounded-md px-3 py-1.5">
              Fast Delivery
            </Badge>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 max-w-2xl">
            Delicious Food, Delivered to Your Door
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-lg mb-8 max-w-2xl">
            Order from our selection of fresh, delicious meals prepared by top
            chefs. Fast delivery, amazing taste.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="search"
              placeholder="Tìm kiếm..."
              className="pl-12 h-12 rounded-lg bg-white text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="px-4 md:px-8 lg:px-40 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Categories */}
            <aside className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24">
              <Card className="p-6 shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Danh mục món ăn
                </h2>
                <div className="space-y-2">
                <button                 
                      key="All"
                      onClick={() => {
                        // Toggle: if same category is clicked, reset to "All"
                        setSelectedCategory(
                          "All"
                        );
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                        selectedCategory === "All"
                          ? "bg-black text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="font-medium">All</span>
                    </button>
                  {categories?.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        // Toggle: if same category is clicked, reset to "All"
                        setSelectedCategory(
                          selectedCategory === category.name ? "All" : category.name
                        );
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedCategory === category.name
                          ? "bg-black text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </aside>

            {/* Right Main Area - Food Listings */}
            <div className="flex-1 lg:flex lg:flex-col">
              {/* Sort Options (sticky) */}
              <div className="flex items-center gap-4 mb-4 flex-wrap lg:sticky lg:top-24 lg:z-10 lg:bg-white lg:py-2">
                <span className="text-gray-600 font-medium">Xắp xếp:</span>
                <div className="flex gap-2 flex-wrap">
                  {sortOptions.map((option) => (
                    <Button
                      key={option}
                      onClick={() => setSelectedSort(option)}
                      variant={selectedSort === option ? "default" : "outline"}
                      className={
                        selectedSort === option
                          ? "bg-black text-white hover:bg-black/90"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                      }
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Scrollable Items area */}
              <div className="lg:max-h-[calc(100vh-160px)] lg:overflow-auto lg:pr-2">
                {/* Food Item Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {items?.map((item) => (
                    <Card
                      key={item.id}
                      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/product/${item.id}`)}
                    >
                      {/* Image Section */}
                      <div className="relative aspect-[16/9]">
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
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>

                      {/* Content Section */}
                      <CardHeader className="px-4 py-3 pb-2">
                        <CardTitle className="text-lg font-bold text-gray-900 mb-1.5">
                          {item.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 mb-2 leading-relaxed">
                          {item.description}
                        </CardDescription>
                        <div className="flex items-center justify-between text-sm mt-2">
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
                        <p className="text-xs text-gray-500 mt-1">
                          {item.soldQuantity} đã bán
                        </p>
                      </CardHeader>

                      {/* Footer with Price and Add Button */}
                      <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-gray-900">
                            {formatCurrency(getEffectivePrice(item))}
                          </span>
                          {item.isOnSale && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(item.originalPrice)}
                            </span>
                          )}
                        </div>
                        <Button 
                          className="bg-black text-white hover:bg-black/90 rounded-md px-4 py-2 h-9 flex items-center gap-1.5 cursor-pointer" 
                          disabled={!item.isAvailable}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          {item.isAvailable ? "Thêm vào giỏ hàng" : "Hết hàng"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {total > 0 && (() => {
                const totalPages = Math.ceil(total / pageSize);
                
                // If total pages is 7 or less, show all pages
                const getVisiblePages = () => {
                  if (totalPages <= 7) {
                    return Array.from({ length: totalPages }, (_, i) => i + 1);
                  }
                  
                  // For more than 7 pages, show smart pagination
                  const visiblePages: number[] = [1]; // Always show first page
                  
                  if (page <= 3) {
                    // Show first 5 pages when near the start
                    for (let i = 2; i <= 5; i++) {
                      visiblePages.push(i);
                    }
                  } else if (page >= totalPages - 2) {
                    // Show last 5 pages when near the end
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                      if (i > 1 && !visiblePages.includes(i)) {
                        visiblePages.push(i);
                      }
                    }
                  } else {
                    // Show pages around current page
                    visiblePages.push(page - 1, page, page + 1);
                  }
                  
                  if (totalPages > 1 && !visiblePages.includes(totalPages)) {
                    visiblePages.push(totalPages); // Always show last page
                  }
                  
                  return visiblePages.sort((a, b) => a - b);
                };
                
                const visiblePages = getVisiblePages();
                
                return (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          className={
                            page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      
                      {visiblePages.map((pageNum, index) => {
                        const prevPage = visiblePages[index - 1];
                        const showEllipsis = prevPage && pageNum - prevPage > 1;

                        return (
                          <React.Fragment key={pageNum}>
                            {showEllipsis && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => setPage(pageNum)}
                                isActive={page === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                          className={
                            page >= totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                );
              })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}