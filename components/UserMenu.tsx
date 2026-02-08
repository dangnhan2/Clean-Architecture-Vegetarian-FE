import Link from "next/link";
import { useState } from "react";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/context/context";

interface UserMenuProps {
  fullName?: string;
  avatarUrl?: string;
  onLogout: () => void;
  isAdminPage?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const UserMenu = ({ fullName, avatarUrl, onLogout, isAdminPage = false, onOpenChange }: UserMenuProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const setMenuOpen = (value: boolean) => {
    setOpen(value);
    onOpenChange?.(value);
  };

  const handleToggleClick = () => {
    setMenuOpen(!open);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setMenuOpen(true)}
      onMouseLeave={() => setMenuOpen(false)}
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
          {/* Hover bridge để không bị mất dropdown khi di chuyển chuột */}
          <div
            className="absolute left-0 right-0 top-full h-4 z-50"
            onMouseEnter={() => setMenuOpen(true)}
            aria-hidden
          />
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-white shadow-md z-50"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
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
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
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
