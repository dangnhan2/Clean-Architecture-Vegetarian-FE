"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Star } from "lucide-react";
import { AddToCart, GetCategories, GetFoodItems } from "@/services/api";
import PaginationControl from "@/components/common/PaginationControl";
import { useAuth } from "@/context/context";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProductPage() {
  const {user, fetchCart} = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Mặc định");
  const [categories, setCategories] = useState<ICategory[] | null | undefined>();
  const [items, setItems] = useState<IFoodItem[] | null | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

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
      query += `&search=${selectedCategory}`
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
  }, [page, pageSize,selectedCategory, selectedSort]);

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
      <div className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] overflow-hidden">
        <Image
          src="/dummy.png"
          alt="Tất cả sản phẩm"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black">
            Tất cả sản phẩm
          </h1>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="px-4 md:px-8 lg:px-40 py-6 md:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8">
            {/* Left Sidebar - Categories */}
            <aside className="w-full lg:w-56 flex-shrink-0 lg:sticky lg:top-24">
              <Card className="p-3 md:p-4 shadow-md">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">
                  Danh mục món ăn
                </h2>
                <div className="flex lg:flex-col gap-2 lg:space-y-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-4 md:-mx-6 px-4 md:px-6 lg:mx-0 lg:px-0">
                <button                 
                      key="All"
                      onClick={() => {
                        // Toggle: if same category is clicked, reset to "All"
                        setSelectedCategory(
                          "All"
                        );
                      }}
                      className={`flex-shrink-0 lg:w-full flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors cursor-pointer text-xs md:text-sm ${
                        selectedCategory === "All"
                          ? "bg-black text-white"
                          : "text-gray-700 hover:bg-gray-100 bg-gray-50"
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
                      className={`flex-shrink-0 lg:w-full flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-colors text-xs md:text-sm ${
                        selectedCategory === category.name
                          ? "bg-black text-white"
                          : "text-gray-700 hover:bg-gray-100 bg-gray-50"
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
              {/* Sort Options */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 flex-wrap">
                <span className="text-gray-600 font-medium text-sm md:text-base">Xắp xếp:</span>
                <div className="flex gap-2 flex-wrap">
                  {sortOptions.map((option) => (
                    <Button
                      key={option}
                      onClick={() => setSelectedSort(option)}
                      variant={selectedSort === option ? "default" : "outline"}
                      className={`text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2 h-8 md:h-9 ${
                        selectedSort === option
                          ? "bg-black text-white hover:bg-black/90"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"
                      }`}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Items area */}
              <div>
                {/* Food Item Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
                  {items?.map((item) => (
                    <Card
                      key={item.id}
                      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/product/${item.id}`)}
                    >
                      {/* Image Section */}
                      <div className="relative aspect-[4/3] md:aspect-[16/9]">
                        <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1 md:gap-2 z-10">
                          {item.isOnSale && item.discountPercent && item.discountPercent > 0 && (
                            <Badge className="bg-red-500 text-white hover:bg-red-500/90 text-xs md:text-sm px-1.5 md:px-2 py-0.5 md:py-1">
                              -{item.discountPercent}%
                            </Badge>
                          )}
                          {!item.isAvailable && (
                            <Badge className="bg-gray-900/80 text-white hover:bg-gray-900/90 text-xs md:text-sm px-1.5 md:px-2 py-0.5 md:py-1">
                              Tạm hết
                            </Badge>
                          )}
                        </div>
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 33vw"
                        />
                      </div>

                      {/* Content Section */}
                      <CardHeader className="px-2 md:px-4 py-2 md:py-3 pb-1 md:pb-2">
                        <CardTitle className="text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-1 md:mb-1.5 line-clamp-1 md:line-clamp-2">
                          {item.name}
                        </CardTitle>
                        <CardDescription className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2 leading-relaxed line-clamp-2 hidden md:block">
                          {item.description}
                        </CardDescription>
                        <div className="flex items-center justify-between text-xs md:text-sm mt-1 md:mt-2">
                          <div className="flex items-center gap-0.5 md:gap-1 text-amber-500">
                            <Star className="h-3 w-3 md:h-4 md:w-4 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">
                              {formatRating(item.averageRating)}
                            </span>
                            <span className="text-gray-500 text-xs">
                              ({item.ratingCount ?? 0})
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 md:mt-1">
                          {item.soldQuantity} đã bán
                        </p>
                      </CardHeader>

                      {/* Footer with Price and Add Button */}
                      <CardFooter className="px-2 md:px-4 pb-2 md:pb-4 pt-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
                        <div className="flex flex-col w-full md:w-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-base md:text-lg lg:text-xl font-bold text-[#7cc242]">
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
                          className="bg-black text-white hover:bg-black/90 rounded-md px-2 md:px-3 py-1 md:py-1.5 h-7 md:h-8 flex items-center gap-1 cursor-pointer text-xs md:text-sm w-full md:w-auto" 
                          disabled={!item.isAvailable}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                        >
                          <Plus className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          <span className="hidden md:inline">{item.isAvailable ? "Thêm" : "Hết"}</span>
                          <span className="md:hidden">{item.isAvailable ? "+" : "×"}</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                <PaginationControl
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  className="mt-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}