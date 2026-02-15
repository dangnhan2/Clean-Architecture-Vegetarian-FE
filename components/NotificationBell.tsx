"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/context";
import { GetUnreadNotificationCount } from "@/services/api";
import { useRouter } from "next/navigation";
import { createSignalRConnection } from "@/lib/signalR";
import * as signalR from "@microsoft/signalr";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationBellProps {
  userId: string;
  notificationRoute?: string; // Optional route for notifications page
}

const NotificationBell = ({ userId, notificationRoute = "/admin/notifications" }: NotificationBellProps) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const router = useRouter();
  const { accessToken } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch unread count and notifications
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await GetUnreadNotificationCount(userId);
      if (res.isSuccess && Number(res.statusCode) === 200 && res.data !== undefined) {
        setUnreadCount(res.data.total || 0);
        setNotifications(res.data.unreadNotifications || []);
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

  // Listen for notification updates from notification page
  useEffect(() => {
    const handleNotificationUpdate = () => {
      // Refetch unread count when notification is marked as read in notification page
      if (userId) {
        fetchUnreadCount();
      }
    };

    window.addEventListener('notificationUpdated', handleNotificationUpdate);
    return () => {
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    };
  }, [userId, fetchUnreadCount]);


  // Initialize SignalR connection
  useEffect(() => {
    if (!userId || !accessToken) {
      return;
    }

    let isMounted = true;
    let connection: signalR.HubConnection | null = null;

    // Cleanup existing connection first - đợi connection stop hoàn toàn
    const cleanup = async () => {
      if (connectionRef.current) {
        try {
          // Đợi connection stop hoàn toàn trước khi tạo connection mới
          await connectionRef.current.stop();
        } catch (error) {
          // Ignore errors during cleanup
          console.log("Error during cleanup:", error);
        }
        connectionRef.current = null;
      }
    };

    // Hàm khởi tạo connection
    const initializeConnection = async () => {
      // Đợi cleanup xong
      await cleanup();
      
      if (!isMounted) return;

      connection = createSignalRConnection(accessToken);

      // Listen for new orders - khi có đơn hàng mới
      connection.on("NewOrder", (notification: INotification) => {
        console.log("New order received via SignalR", notification);
        // Thêm thông báo mới vào danh sách và tăng số lượng
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      connection.on("RatingMenu", (notification: INotification) => {
        console.log("Menu rating received via SignalR", notification);
        // Thêm thông báo mới vào danh sách và tăng số lượng
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      connection.on("OrderConfirmed", (notification: INotification) => {
        console.log("Order confirmed received via SignalR", notification);
        // Thêm thông báo mới vào danh sách và tăng số lượng
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Connection events
      connection.onclose((error) => {
        if (isMounted) {
          setIsConnected(false);
          if (error) {
            console.log("SignalR connection closed with error:", error);
          }
        }
      });

      connection.onreconnecting((error) => {
        if (isMounted) {
          setIsConnected(false);
          console.log("SignalR reconnecting...", error);
        }
      });

      connection.onreconnected((connectionId) => {
        if (isMounted) {
          setIsConnected(true);
          console.log("SignalR reconnected. Connection ID:", connectionId);
        }
      });

      // Start connection - đảm bảo không bị stop trong quá trình negotiation
      try {
        await connection.start();
        if (isMounted) {
          console.log("SignalR connected successfully");
          setIsConnected(true);
          connectionRef.current = connection;
          // Thử fetch một lần khi kết nối thành công
          fetchUnreadCount();
        }
      } catch (error: any) {
        if (isMounted) {
          console.error("SignalR connection error:", error);
          console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
            // Log thông tin về connection state
            connectionState: connection?.state,
          });
          
          // Kiểm tra các nguyên nhân phổ biến
          if (error.message?.includes("CORS")) {
            console.error("CORS error detected. Check backend CORS configuration.");
          }
          if (error.message?.includes("SSL") || error.message?.includes("certificate")) {
            console.error("SSL/Certificate error. Backend may need valid SSL certificate or client needs to accept self-signed cert.");
          }
          if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
            console.error("Authentication error. Check if access token is valid.");
          }
          
          // Nếu lỗi negotiation, thử lại với skipNegotiation
          if (error.message?.includes("negotiation") || error.message?.includes("stopped during negotiation")) {
            console.error("Negotiation error detected. Trying with skipNegotiation...");
            
            // Cleanup connection cũ
            if (connection) {
              try {
                await connection.stop();
              } catch (stopError) {
                // Ignore stop errors
              }
            }
            
            // Thử kết nối lại với skipNegotiation
            try {
              const directConnection = createSignalRConnection(accessToken);
              
              // Setup lại các event handlers
              directConnection.on("NewOrder", (notification: INotification) => {
                console.log("New order received via SignalR", notification);
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
              });

              directConnection.on("RatingMenu", (notification: INotification) => {
                console.log("Menu rating received via SignalR", notification);
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
              });

              directConnection.on("OrderConfirmed", (notification: INotification) => {
                console.log("Order confirmed received via SignalR", notification);
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
              });

              directConnection.onclose((error) => {
                if (isMounted) {
                  setIsConnected(false);
                  if (error) {
                    console.log("SignalR connection closed with error:", error);
                  }
                }
              });

              directConnection.onreconnecting((error) => {
                if (isMounted) {
                  setIsConnected(false);
                  console.log("SignalR reconnecting...", error);
                }
              });

              directConnection.onreconnected((connectionId) => {
                if (isMounted) {
                  setIsConnected(true);
                  console.log("SignalR reconnected. Connection ID:", connectionId);
                }
              });
              
              await directConnection.start();
              if (isMounted) {
                console.log("SignalR connected successfully with skipNegotiation");
                setIsConnected(true);
                connectionRef.current = directConnection;
                fetchUnreadCount();
              }
            } catch (retryError: any) {
              console.error("SignalR connection with skipNegotiation also failed:", retryError);
              setIsConnected(false);
            }
          } else {
            setIsConnected(false);
            // Cleanup connection nếu start thất bại
            if (connection) {
              try {
                await connection.stop();
              } catch (stopError) {
                // Ignore stop errors
              }
            }
          }
        }
      }
    };

    // Khởi tạo connection
    initializeConnection();

    return () => {
      isMounted = false;
      // Cleanup khi component unmount
      if (connectionRef.current) {
        connectionRef.current.stop().catch((error) => {
          // Ignore errors during cleanup
          console.log("Error stopping connection during cleanup:", error);
        });
        connectionRef.current = null;
      }
    };
  }, [userId, accessToken]); // Removed fetchUnreadCount from dependencies

  // Reset state khi userId thay đổi
  useEffect(() => {
    setUnreadCount(0);
    setNotifications([]);
    setIsHovered(false);
  }, [userId]);

  // Initial fetch - chỉ fetch một lần khi component mount hoặc userId thay đổi
  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
    }
  }, [userId, fetchUnreadCount]);

  const handleClick = () => {
    router.push(notificationRoute);
  };

  const handleMouseEnter = () => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Delay đóng dropdown một chút để tránh đóng nhầm khi di chuột nhanh
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Thông báo"
        onMouseEnter={handleMouseEnter}
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isHovered && (
        <>
          {/* Invisible bridge to prevent gap issues - chỉ giữ hover, không đóng khi leave */}
          <div 
            className="absolute right-0 top-full w-96 h-2 z-50"
            onMouseEnter={handleMouseEnter}
          />
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-1 w-96 max-h-[500px] overflow-hidden z-50"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
          <Card className="shadow-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Thông báo</h3>
                {unreadCount > 0 && (
                  <Badge variant="default" className="bg-red-500">
                    {unreadCount} mới
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Không có thông báo mới</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.isRead ? "bg-blue-50/50" : ""
                      }`}
                      onClick={() => router.push(notificationRoute)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-semibold text-gray-900 ${
                              !notification.isRead ? "" : "font-normal"
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {notification.createdAt}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={handleClick}
                >
                  Xem tất cả thông báo
                </Button>
              </div>
            )}
          </Card>
        </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;

