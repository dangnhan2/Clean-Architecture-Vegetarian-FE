"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/context";
import { GetUnreadNotificationCount } from "@/services/api";
import { useRouter } from "next/navigation";
import { createSignalRConnection } from "@/lib/signalR";
import * as signalR from "@microsoft/signalr";

interface NotificationBellProps {
  userId: string;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const router = useRouter();
  const { accessToken } = useAuth();

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await GetUnreadNotificationCount(userId);
      if (res.isSuccess && Number(res.statusCode) === 200 && res.data !== undefined) {
        setUnreadCount(res.data);
      }
    } catch (error: any) {
      // Nếu API endpoint chưa tồn tại (404), không log error
      // Chỉ log nếu không phải 404
      if (error?.response?.status !== 404) {
        console.error("Failed to fetch unread count:", error);
      }
      // Nếu API không tồn tại, giữ nguyên số lượng hiện tại
      // Số lượng sẽ được cập nhật qua SignalR events
    }
  }, [userId]);

  // Initialize SignalR connection
  useEffect(() => {
    if (!userId || !accessToken) {
      return;
    }

    const connection = createSignalRConnection(accessToken);

    // Listen for new notifications - khi có thông báo mới
    connection.on("ReceiveNotification", () => {
      console.log("Received new notification via SignalR");
      // Tăng số lượng thông báo chưa đọc
      setUnreadCount(prev => prev + 1);
    });

    // Listen for new orders - khi có đơn hàng mới
    connection.on("NewOrder", () => {
      console.log("New order received via SignalR");
      // Tăng số lượng thông báo chưa đọc
      setUnreadCount(prev => prev + 1);
    });

    // Listen for order created event (nếu backend gửi event này)
    connection.on("OrderCreated", () => {
      console.log("Order created via SignalR");
      // Tăng số lượng thông báo chưa đọc
      setUnreadCount(prev => prev + 1);
    });

    // Connection events
    connection.onclose(() => {
      setIsConnected(false);
    });

    connection.onreconnecting(() => {
      setIsConnected(false);
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      // Không fetch lại nếu API không tồn tại
      // fetchUnreadCount();
    });

    // Start connection
    connection
      .start()
      .then(() => {
        setIsConnected(true);
        // Thử fetch một lần khi kết nối thành công
        fetchUnreadCount();
      })
      .catch((error) => {
        console.error("SignalR connection error:", error);
        setIsConnected(false);
      });

    connectionRef.current = connection;

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [userId, accessToken, fetchUnreadCount]);

  // Initial fetch - chỉ fetch một lần khi component mount
  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
    }
  }, [userId]);

  const handleClick = () => {
    router.push("/admin/notifications");
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Thông báo"
    >
      <Bell className="w-6 h-6 text-gray-700" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;

