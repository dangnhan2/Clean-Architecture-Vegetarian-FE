import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/context/context";
import { Logout } from "@/services/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  fullName?: string;
  avatarUrl?: string;
  onLogout?: () => void;
  isAdminPage?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const UserMenu = ({ fullName, avatarUrl, onLogout, isAdminPage = false, onOpenChange }: UserMenuProps) => {
  const { user, setAccessToken, setIsAuthen, setUser } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMenuOpen = (value: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(value);
    onOpenChange?.(value);
  };

  const handleToggleClick = () => {
    setMenuOpen(!open);
  };

  const handleLogout = async () => {
    setOpen(false);
    // Chỉ gọi callback onLogout - callback sẽ xử lý việc gọi API logout
    // Tránh gọi API logout nhiều lần
    if (onLogout) {
      onLogout();
    } else {
      // Nếu không có callback, tự xử lý logout
      try {
        const res = await Logout();
        if (res.isSuccess && Number(res.statusCode) === 200) {
          // Xóa token khỏi localStorage
          localStorage.removeItem("access_token");
          setAccessToken(undefined);
          setUser(undefined);
          setIsAuthen(false);
          toast.success(res.message);
          router.push("/auth/login");
        } else {
          toast.error(res.message);
        }
      } catch (error) {
        console.error("Logout error:", error);
        // Vẫn xóa token và clear state ngay cả khi API thất bại
        localStorage.removeItem("access_token");
        setAccessToken(undefined);
        setUser(undefined);
        setIsAuthen(false);
        toast.error("Đã xảy ra lỗi khi đăng xuất");
        router.push("/auth/login");
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Kiểm tra xem chuột có đang di chuyển đến phần tử con không
    const relatedTarget = e.relatedTarget as Node | null;
    if (menuContainerRef.current && relatedTarget && menuContainerRef.current.contains(relatedTarget)) {
      return; // Chuột đang di chuyển đến phần tử con, không đóng menu
    }
    // Delay một chút để cho phép chuột di chuyển đến dropdown
    timeoutRef.current = setTimeout(() => {
      setMenuOpen(false);
    }, 150);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMenuOpen(true);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={menuContainerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={handleToggleClick}
      >
        <UserAvatar avatar={avatarUrl} />
        {fullName && (
          <span className="hidden sm:inline font-medium text-base max-w-[140px] truncate">{fullName}</span>
        )}
      </div>

      {open && (
        <>
          {/* Hover bridge để không bị mất dropdown khi di chuyển chuột từ button đến dropdown */}
          <div
            className="absolute right-0 top-full w-56 h-2 z-50 pointer-events-auto"
            onMouseEnter={handleMouseEnter}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-white shadow-md z-50"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          > 
            <Link
              href="/account/profile"
              className="block px-4 py-2 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Tài khoản của tôi
            </Link>
            
            <Link
              href="/purchase"
              className="block px-4 py-2 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Lịch sử đơn hàng
            </Link>
            
            {user?.role === "Admin" && (
              <Link
                href={isAdminPage ? "/" : "/admin"}
                className="block px-4 py-2 hover:bg-gray-50 border-t border-gray-200 mt-1 pt-2"
                onClick={() => setOpen(false)}
              >
                {isAdminPage ? "Trang chủ" : "Admin Dashboard"}
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 border-t border-gray-200 mt-1 pt-2"
            >
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
