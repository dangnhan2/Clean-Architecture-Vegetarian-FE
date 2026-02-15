"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { GetNotificationByAdmin, MarkNotificationAsRead } from "@/services/api";
import { useAuth } from "@/context/context";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createSignalRConnection } from "@/lib/signalR";
import * as signalR from "@microsoft/signalr";
import { 
  Bell, 
  Package,
  CheckCheck,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Eye,
  ShoppingBag,
  Star
} from "lucide-react";

const UserNotificationsPage = () => {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<INotification[] | null | undefined>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<INotification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await GetNotificationByAdmin(user.id);
      
      if (res.isSuccess && Number(res.statusCode) === 200) {
        if (res?.data) {
          setNotifications(res.data);
        } else {
          setNotifications([]);
        }
      } else {
        toast.error(res.message || "Không thể tải thông báo");
        setNotifications([]);
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      // Nếu API endpoint chưa tồn tại (404), không hiển thị error
      if (error?.response?.status !== 404) {
        toast.error("Đã xảy ra lỗi khi tải thông báo");
      }
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Initialize SignalR connection for real-time notifications
  useEffect(() => {
    if (!user?.id || !accessToken) {
      return;
    }

    let isMounted = true;
    let connection: signalR.HubConnection | null = null;

    const cleanup = async () => {
      if (connectionRef.current) {
        try {
          await connectionRef.current.stop();
        } catch (error) {
          console.log("Error during cleanup:", error);
        }
        connectionRef.current = null;
      }
    };

    const initializeConnection = async () => {
      await cleanup();
      
      if (!isMounted) return;

      connection = createSignalRConnection(accessToken);

      // Listen for OrderConfirmed - thông báo khi đơn hàng được xác nhận
      connection.on("OrderConfirmed", (notification: INotification) => {
        console.log("OrderConfirmed received via SignalR", notification);
        if (isMounted) {
          // Thêm thông báo mới vào đầu danh sách
          setNotifications(prev => {
            if (!prev) return [notification];
            // Kiểm tra xem thông báo đã tồn tại chưa (tránh duplicate)
            const exists = prev.some(n => n.id === notification.id);
            if (exists) return prev;
            return [notification, ...prev];
          });
          toast.success("Bạn có thông báo mới: " + notification.title);
        }
      });

      // Listen for NewOrder - thông báo đơn hàng mới (nếu cần)
      connection.on("NewOrder", (notification: INotification) => {
        console.log("NewOrder received via SignalR", notification);
        if (isMounted) {
          setNotifications(prev => {
            if (!prev) return [notification];
            const exists = prev.some(n => n.id === notification.id);
            if (exists) return prev;
            return [notification, ...prev];
          });
          toast.success("Bạn có thông báo mới: " + notification.title);
        }
      });

      // Listen for RatingMenu - thông báo đánh giá menu
      connection.on("RatingMenu", (notification: INotification) => {
        console.log("RatingMenu received via SignalR", notification);
        if (isMounted) {
          setNotifications(prev => {
            if (!prev) return [notification];
            const exists = prev.some(n => n.id === notification.id);
            if (exists) return prev;
            return [notification, ...prev];
          });
          toast.success("Bạn có thông báo mới: " + notification.title);
        }
      });

      // Connection events
      connection.onclose((error) => {
        if (isMounted && error) {
          console.log("SignalR connection closed with error:", error);
        }
      });

      connection.onreconnecting((error) => {
        if (isMounted) {
          console.log("SignalR reconnecting...", error);
        }
      });

      connection.onreconnected((connectionId) => {
        if (isMounted) {
          console.log("SignalR reconnected. Connection ID:", connectionId);
          // Refresh notifications khi reconnect
          if (fetchNotifications) {
            fetchNotifications();
          }
        }
      });

      // Start connection
      try {
        await connection.start();
        if (isMounted) {
          console.log("SignalR connected successfully on notifications page");
          connectionRef.current = connection;
        }
      } catch (error: any) {
        if (isMounted) {
          console.error("SignalR connection error:", error);
        }
      }
    };

    initializeConnection();

    return () => {
      isMounted = false;
      if (connectionRef.current) {
        connectionRef.current.stop().catch((error) => {
          console.log("Error stopping connection during cleanup:", error);
        });
        connectionRef.current = null;
      }
    };
  }, [user?.id, accessToken, fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    if (!user?.id || !notifications || notifications.length === 0) return;

    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) {
      toast.info("Tất cả thông báo đã được đánh dấu đã đọc");
      return;
    }

    try {
      const notificationIds = unreadNotifications.map(n => n.id);
      const res = await MarkNotificationAsRead(notificationIds);
      if (res.isSuccess && Number(res.statusCode) === 200) {
        setNotifications(prev => prev?.map(n => ({ ...n, isRead: true })));
        toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
        // Dispatch event to update notification bell
        window.dispatchEvent(new CustomEvent('notificationUpdated'));
      } else {
        toast.error(res.message || "Không thể đánh dấu thông báo");
      }
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      if (error?.response?.status !== 404) {
        toast.error("Đã xảy ra lỗi khi đánh dấu thông báo");
      }
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await MarkNotificationAsRead([notificationId]);
      if (res.isSuccess && Number(res.statusCode) === 200) {
        setNotifications(prev => 
          prev?.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        toast.success(res.message || "Đã đánh dấu thông báo là đã đọc");
        // Dispatch event to update notification bell
        window.dispatchEvent(new CustomEvent('notificationUpdated'));
      } else {
        toast.error(res.message || "Không thể đánh dấu thông báo");
      }
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      if (error?.response?.status !== 404) {
        toast.error("Đã xảy ra lỗi khi đánh dấu thông báo");
      }
    }
  };

  const handleDeleteClick = (notification: INotification) => {
    setNotificationToDelete(notification);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;

    setIsDeleting(true);
    try {
      // Note: Có thể cần API DeleteNotificationByUser, nhưng tạm thời chỉ xóa local
      setNotifications(prev => prev?.filter(n => n.id !== notificationToDelete.id));
      toast.success("Đã xóa thông báo");
      setIsDeleteDialogOpen(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Đã xảy ra lỗi khi xóa thông báo");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

  const toggleExpand = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const isExpanded = (notificationId: string) => {
    return expandedNotifications.has(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "order":
      case "orderconfirmed":
        return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case "rating":
      case "ratingmenu":
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-purple-500" />;
    }
  };

  const parseNotificationData = (data: string) => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  };

  const handleViewProductDetail = (notification: INotification) => {
    const notificationData = parseNotificationData(notification.data);
    
    if (!notificationData) {
      toast.error("Không tìm thấy thông tin sản phẩm");
      return;
    }

    let menuId: string | null = null;

    if (typeof notificationData === 'object') {
      if ('menuId' in notificationData && notificationData.menuId) {
        menuId = String(notificationData.menuId);
      } else if ('id' in notificationData && notificationData.id) {
        menuId = String(notificationData.id);
      } else if ('productId' in notificationData && notificationData.productId) {
        menuId = String(notificationData.productId);
      } else if ('menu' in notificationData && typeof notificationData.menu === 'object' && notificationData.menu !== null) {
        const menu = notificationData.menu as any;
        if ('id' in menu && menu.id) {
          menuId = String(menu.id);
        } else if ('menuId' in menu && menu.menuId) {
          menuId = String(menu.menuId);
        }
      }
    } else if (typeof notificationData === 'string') {
      menuId = notificationData.trim();
    }

    if (menuId) {
      router.push(`/product/${menuId}`);
    } else {
      toast.error("Không tìm thấy thông tin sản phẩm");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString("vi-VN", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Thông Báo
              </h1>
              <p className="text-gray-600">
                {unreadCount > 0 
                  ? `Bạn có ${unreadCount} thông báo chưa đọc`
                  : "Tất cả thông báo đã được đọc"
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg text-gray-800">
                Danh Sách Thông Báo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                  <p>Đang tải thông báo...</p>
                </div>
              ) : notifications?.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Không có thông báo nào</p>
                  <p className="text-sm">Thông báo mới sẽ xuất hiện ở đây</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications?.map((notification) => {
                    const notificationData = parseNotificationData(notification.data);
                    const isExpandedItem = isExpanded(notification.id);
                    const hasLongMessage = notification.message && notification.message.length > 150;
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-5 hover:bg-gray-50 transition-colors ${
                          !notification.isRead ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className={`text-lg font-semibold text-gray-900 ${
                                    !notification.isRead ? "" : "font-normal"
                                  }`}>
                                    {notification.title}
                                  </h3>
                                  {!notification.isRead && (
                                    <Badge variant="default" className="bg-blue-500">
                                      Mới
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Message */}
                                <div className="mb-3">
                                  <p className={`text-sm text-gray-700 leading-relaxed ${
                                    !isExpandedItem && hasLongMessage ? "line-clamp-3" : ""
                                  }`}>
                                    {notification.message}
                                  </p>
                                  {hasLongMessage && (
                                    <button
                                      onClick={() => toggleExpand(notification.id)}
                                      className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                    >
                                      {isExpandedItem ? (
                                        <>
                                          <ChevronUp className="w-3 h-3" />
                                          Thu gọn
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="w-3 h-3" />
                                          Xem thêm
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Additional Data */}
                                {notificationData && typeof notificationData === 'object' && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Info className="w-4 h-4 text-gray-500" />
                                      <span className="text-xs font-semibold text-gray-700">Thông tin chi tiết:</span>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1">
                                      {Object.entries(notificationData).map(([key, value]) => (
                                        <div key={key} className="flex gap-2">
                                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                          <span className="text-gray-700">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {notificationData && typeof notificationData === 'string' && notificationData.trim() && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Info className="w-4 h-4 text-gray-500" />
                                      <span className="text-xs font-semibold text-gray-700">Thông tin bổ sung:</span>
                                    </div>
                                    <p className="text-xs text-gray-600">{notificationData}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(notification.createdAt)}</span>
                                <span className="text-gray-300">•</span>
                                <span>{new Date(notification.createdAt).toLocaleString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {(notification.type?.toLowerCase() === "rating" || notification.type?.toLowerCase() === "ratingmenu") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewProductDetail(notification)}
                                    className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Xem chi tiết
                                  </Button>
                                )}
                                {!notification.isRead && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="h-8 text-xs"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Đánh dấu đã đọc
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(notification)}
                                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Xóa
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Xác nhận xóa thông báo</DialogTitle>
                <DialogDescription>
                  Bạn có chắc chắn muốn xóa thông báo <strong>{notificationToDelete?.title}</strong>? Hành động này không thể hoàn tác.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isDeleting ? "Đang xóa..." : "Xóa"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UserNotificationsPage;
