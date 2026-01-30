"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/context";
import UserMenu from "./UserMenu";
import { useRouter } from "next/navigation";
import { Logout } from "@/services/api";
import { toast } from "sonner";
import { useState } from "react";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag, 
  Users, 
  Ticket, 
  Tag,
  Grid2x2,
  Bell,
  Menu,
  X,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

interface AdminHeaderProps {
  children?: React.ReactNode;
}

const AdminHeader = ({ children }: AdminHeaderProps) => {
  const pathname = usePathname();
  const { user, isAuthen, setAccessToken, setIsAuthen, setUser } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    let res = await Logout();
    if (res.isSuccess && Number(res.statusCode) === 200) {
      setAccessToken(undefined);
      setUser(undefined);
      setIsAuthen(false);
      toast.success(res.message);
      router.push("/auth/login");
    } else {
      toast.error(res.message);
    }
  };

  const navItems = [
    {
      href: "/admin",
      label: "Tổng Quan",
      icon: LayoutDashboard,
    },
    {
      href: "/admin/products",
      label: "Quản Lý Món Ăn",
      icon: UtensilsCrossed,
    },
    {
      href: "/admin/orders",
      label: "Quản Lý Đơn Hàng",
      icon: ShoppingBag,
    },
    {
      href: "/admin/users",
      label: "Quản Lý Người Dùng",
      icon: Users,
    },
    {
      href: "/admin/vouchers",
      label: "Quản Lý Voucher",
      icon: Ticket,
    },
    {
      href: "/admin/categories",
      label: "Quản Lý Danh Mục",
      icon: Tag,
    },
    {
      href: "/admin/notifications",
      label: "Thông báo",
      icon: Bell,
    },
    {
      href: "/admin/advertisement",
      label: "Quản Lý Quảng Cáo",
      icon: Megaphone,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar - desktop + tablet, off-canvas on mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 md:static md:translate-x-0 md:flex-shrink-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Grid2x2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-lg font-bold text-transparent md:text-xl">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-xs text-gray-500 md:text-sm">Quản trị hệ thống</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                  active
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-white" : "text-gray-600",
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:h-16 sm:px-6">
          {/* Left: mobile menu + title breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-700 md:hidden"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <div className="hidden flex-col md:flex">
              <span className="text-sm font-semibold text-gray-900">
                Trang quản trị
              </span>
              <span className="text-xs text-gray-500">
                {navItems.find((i) => isActive(i.href))?.label ?? "Tổng Quan"}
              </span>
            </div>
          </div>

          {/* Right: user & notifications */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isAuthen === true ? (
              <>
                {user?.id && (
                  <NotificationBell
                    userId={user.id}
                  />
                )}
                <UserMenu
                  fullName={user?.userName}
                  avatarUrl={user?.imageUrl}
                  onLogout={handleLogout}
                  isAdminPage={pathname.startsWith("/admin")}
                />
              </>
            ) : (
              <Link href="/auth/login">
                <button className="px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:text-gray-900 sm:px-4 sm:py-2">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-white">
          {children}
        </main>
      </div>
    </>
  );
};

export default AdminHeader;

