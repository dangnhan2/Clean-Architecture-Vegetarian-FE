"use client"
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { FaShoppingCart } from "react-icons/fa";
import { Search } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/context";
import UserMenu from "./UserMenu";
import { useRouter } from "next/navigation";
import { Logout, SearchMenu } from "@/services/api";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

const PublicHeader = () => {
  const { user, isAuthen, setAccessToken, setIsAuthen, setUser, cart } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ISearchMenuResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    let res = await Logout();
    if (res.isSuccess && Number(res.statusCode) === 200){
        setAccessToken(undefined);
        setUser(undefined);
        setIsAuthen(false);
        toast.success(res.message);
        router.push("/auth/login");
    }else{
        toast.error(res.message);
    }
    
  };

  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await SearchMenu(keyword.trim());
      if (res.isSuccess && Number(res.statusCode) === 200) {
        setSearchResults(res.data || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search API call
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleItemClick = (menuId: string) => {
    router.push(`/product/${menuId}`);
    setSearchTerm("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/product?name=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + "₫";
  };

  const cartTotal = cart?.items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) || 0;

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="mx-auto max-w-[1920px] px-4 py-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <Link href="/">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black sm:h-12 sm:w-12">
                <Image
                  src="/HapplyFoodLogo.jpg"
                  alt="FoodHub Logo"
                  width={32}
                  height={32}
                  className="h-7 w-7 rounded-full object-cover sm:h-8 sm:w-8"
                  priority
                />
              </span>
            </Link>
            <span className="ml-1 text-lg font-bold sm:text-xl whitespace-nowrap">Happy Food</span>

            {/* Desktop nav */}
            <nav className="ml-2 hidden items-center gap-6 xl:flex">
              <Link href="/">
                <span className="font-semibold transition-colors hover:text-primary whitespace-nowrap">
                  Trang chủ
                </span>
              </Link>
              <Link href="/contact">
                <span className="font-normal transition-colors hover:text-primary whitespace-nowrap">
                  Liên hệ
                </span>
              </Link>
            </nav>
          </div>

          {/* Center: Search bar - kéo dài tối đa trên desktop */}
          <div
            ref={searchContainerRef}
            className="relative hidden md:flex flex-1 min-w-0 max-w-none mx-2 lg:mx-4 xl:mx-6 2xl:mx-8"
          >
            <form onSubmit={handleFormSubmit} className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400 z-10" />
              <Input
                type="search"
                placeholder="Tìm kiếm món ăn..."
                className="h-10 w-full rounded-lg border-gray-200 bg-gray-50 pl-10 focus:bg-white max-w-full"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowDropdown(true);
                  }
                }}
              />
            </form>

            {/* Search Results Dropdown */}
            {showDropdown && (
              <Card className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-auto border-gray-200 shadow-lg">
                <div className="p-2">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Đang tìm kiếm...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-100"
                        >
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-xs font-bold text-gray-600">
                              {item.price.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchTerm.trim() ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Không tìm thấy kết quả
                    </div>
                  ) : null}
                </div>
              </Card>
            )}
          </div>

          {/* Right: Profile + Cart (hoán đổi vị trí) */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Profile/Auth - đặt trước cart */}
            {isAuthen === true ? (
              <UserMenu
                fullName={user?.userName}
                avatarUrl={user?.imageUrl}
                onLogout={handleLogout}
              />
            ) : (
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  className="h-10 px-3 text-sm font-semibold sm:px-4 sm:text-base"
                >
                  Sign In
                </Button>
              </Link>
            )}

            {/* Cart with hover preview */}
            <div className="relative group">
              <Link href="/cart" className="relative inline-flex items-center justify-center h-10 w-10">
                <FaShoppingCart
                  size={22}
                  className="transition-colors hover:text-primary"
                />
                {cart?.items?.length ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] leading-5 text-white">
                    {cart.items.length}
                  </span>
                ) : null}
              </Link>
              
              {/* Hover dropdown - hiển thị danh sách items */}
              <div className="pointer-events-none absolute right-0 top-full mt-2 w-80 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 sm:w-96 md:w-[420px] bg-white shadow-xl border border-gray-200 rounded-lg z-50">
                <div className="p-4">
                  <h3 className="mb-3 text-lg font-bold text-gray-900">
                    Giỏ hàng của bạn
                  </h3>
                  <div className="mb-3 border-t border-gray-200" />
                  <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
                    {cart?.items && cart.items.length > 0 ? (
                      cart.items.map((ci) => (
                        <div
                          key={ci.id}
                          className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                        >
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                            <Image
                              src={ci.imageUrl}
                              alt={ci.menuName}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 truncate text-sm font-semibold text-gray-900">
                              {ci.menuName}
                            </p>
                            <p className="mb-1 text-xs text-gray-500">
                              Số lượng: x{ci.quantity}
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(ci.unitPrice * ci.quantity)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-sm text-gray-500">
                        Giỏ hàng trống
                      </div>
                    )}
                  </div>
                </div>
                {cart?.items && cart.items.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4 rounded-b-lg">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Tổng cộng:</span>
                      <span className="text-lg font-bold text-black">
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>
                    <Link
                      href="/cart"
                      className="block w-full rounded-md bg-black py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-black/90"
                    >
                      Xem giỏ hàng
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 md:hidden"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search bar */}
        <div
          ref={searchContainerRef}
          className="relative md:hidden mt-2 w-full"
        >
          <form onSubmit={handleFormSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400 z-10" />
            <Input
              type="search"
              placeholder="Tìm kiếm món ăn..."
              className="h-10 w-full rounded-lg border-gray-200 bg-gray-50 pl-10 focus:bg-white"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowDropdown(true);
                }
              }}
            />
          </form>

          {/* Search Results Dropdown - Mobile */}
          {showDropdown && (
            <Card className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-auto border-gray-200 shadow-lg">
              <div className="p-2">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Đang tìm kiếm...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-100"
                      >
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-xs font-bold text-gray-600">
                            {item.price.toLocaleString("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchTerm.trim() ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Không tìm thấy kết quả
                  </div>
                ) : null}
              </div>
            </Card>
          )}
        </div>

        {/* Mobile nav dropdown */}
        {isMobileMenuOpen && (
          <nav className="flex flex-col gap-1 border-t border-gray-100 pt-2 text-sm md:hidden">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="block rounded-md px-2 py-2 font-semibold text-gray-900 hover:bg-gray-50">
                Trang chủ
              </span>
            </Link>
            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="block rounded-md px-2 py-2 text-gray-700 hover:bg-gray-50">
                Liên hệ
              </span>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
