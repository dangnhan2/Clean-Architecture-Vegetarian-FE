"use client"
import AdminHeader from "@/components/AdminHeader";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-white">
      <AdminHeader>{children}</AdminHeader>
    </div>
  );
};

export default AdminLayout;

