"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/context";
import UserMenu from "./UserMenu";
import { useRouter } from "next/navigation";
import { Logout } from "@/services/api";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag, 
  Users, 
  Ticket, 
  Tag,
  Grid2x2,
  Bell
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
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 flex flex-col bg-white flex-shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Grid2x2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-sm text-gray-500">Quản trị hệ thống</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group",
                  active
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? "text-white" : "text-gray-600")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-end px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
          {isAuthen === true ? (
            <>
              {user?.id && <NotificationBell userId={user.id} />}
              <UserMenu 
                fullName={user?.userName} 
                avatarUrl={user?.imageUrl} 
                onLogout={handleLogout}
                isAdminPage={pathname.startsWith("/admin")}
              />
            </>
          ) : (
              <Link href="/auth/login">
                <button className="px-4 py-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </>
  );
};

export default AdminHeader;

