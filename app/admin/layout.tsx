"use client"
import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex h-screen bg-white">
        <AdminHeader>{children}</AdminHeader>
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;

