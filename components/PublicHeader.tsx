"use client"
import Link from "next/link";
import { Button } from "./ui/button";
import { FaShoppingCart } from "react-icons/fa";
import Image from "next/image";
import { useAuth } from "@/context/context";
import UserMenu from "./UserMenu";
import { useRouter } from "next/navigation";
import { Logout } from "@/services/api";
import { toast } from "sonner";

const PublicHeader = () => {
  const { user, isAuthen, setAccessToken, setIsAuthen, setUser, cart } = useAuth();
  const router = useRouter();

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

  return (
    <header className="w-full h-16 flex items-center px-40 bg-white shadow-sm justify-between">
      <div className="flex items-center gap-4">
        <Link href="/">
          <span className="rounded-xl bg-black p-2 flex items-center justify-center w-12 h-12">
            <Image
              src="/HapplyFoodLogo.jpg"
              alt="FoodHub Logo"
              width={32}
              height={32}
              className="object-cover w-8 h-8 rounded-full"
              priority
            />
          </span>
        </Link>
        <span className="font-bold text-xl ml-2">Happy Food</span>
        <nav className="flex gap-6 ml-6">
          <Link href="/">
            <span className="font-semibold hover:text-primary transition-colors">Trang chủ</span>
          </Link>
          <Link href="/contact">
            <span className="font-normal hover:text-primary transition-colors">Liên hệ</span>
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {/* Cart with hover preview */}
        <div className="relative group">
          <Link href="/cart" className="relative inline-block">
            <FaShoppingCart size={22} className="hover:text-primary transition-colors" />
            {cart?.items?.length ? (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-black text-white text-[10px] leading-5 text-center">
                {cart.items.length}
              </span>
            ) : null}
          </Link>
          {/* Hover panel */}
          <div className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-150 absolute right-0 mt-3 w-96 sm:w-[420px] bg-white shadow-lg border rounded-md z-50 before:content-[''] before:absolute before:-top-3 before:right-0 before:h-3 before:w-full">
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Giỏ hàng của bạn</h3>
              <div className="border-t border-gray-200 mb-4"></div>
              <div className="max-h-96 overflow-auto space-y-3">
                {cart?.items && cart.items.length > 0 ? (
                  cart.items.map((ci) => (
                    <div key={ci.id} className="flex items-center gap-4 py-2">
                      <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg border">
                        <Image src={ci.imageUrl} alt={ci.menuName} fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate mb-1">{ci.menuName}</p>
                        <p className="text-xs text-gray-500 mb-1">Số lượng: x{ci.quantity}</p>
                        <p className="text-sm font-bold text-gray-900">
                          {(ci.unitPrice * ci.quantity).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-gray-500">Giỏ hàng trống</div>
                )}
              </div>
            </div>
            {cart?.items && cart.items.length > 0 && (
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <Link href="/cart" className="block w-full text-center text-sm font-semibold py-2.5 rounded-md bg-black text-white hover:bg-black/90 transition-colors">
                  Xem giỏ hàng
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {isAuthen === true ? (
          <UserMenu fullName={user?.fullName} avatarUrl={user?.imageUrl} onLogout={handleLogout} />
        ) : (
          <Link href="/auth/login">
            <Button variant="ghost" className="font-semibold">Sign In</Button>
          </Link>
        )}       
      </div>
    </header>
  );
};

export default PublicHeader;
