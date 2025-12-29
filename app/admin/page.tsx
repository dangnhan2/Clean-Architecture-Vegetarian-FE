"use client";

import { useEffect, useState } from "react";
import { GetDashboard } from "@/services/api";
import Dashboard from "@/components/admin/dashboard/Dashboard";
import { toast } from "sonner";

const AdminHomePage = () => {
  const [dashboardData, setDashboardData] = useState<IDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await GetDashboard();
      if (res.isSuccess && Number(res.statusCode) === 200) {
        if (res?.data) {
          setDashboardData(res.data);
        }
      } else {
        toast.error(res.message || "Không thể tải dữ liệu dashboard");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Không có dữ liệu để hiển thị</p>
        </div>
      </div>
    );
  }

  return <Dashboard data={dashboardData} />;
};

export default AdminHomePage;


