"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { GetNotificationByAdmin, DeleteNotification, MarkNotificationAsRead } from "@/services/api";
import { useAuth } from "@/context/context";
import { toast } from "sonner";
import { 
  Bell, 
  FileText,
  UserPlus,
  Package,
  CheckCheck,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Eye
} from "lucide-react";

const AdminNotificationsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<INotification[] | null | undefined>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<INotification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await GetNotificationByAdmin(user.id);
      
      if (res.isSuccess && Number(res.statusCode) === 200) {
        // Kiểm tra nhiều trường hợp cấu trúc response
        if (res?.data) {
          // Nếu res.data là array trực tiếp         
            setNotifications(res.data);       
        } else {
          setNotifications([]);
        }
      } else {
        toast.error(res.message || "Không thể tải thông báo");
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Đã xảy ra lỗi khi tải thông báo");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  const handleMarkAllAsRead = async () => {
    // TODO: Implement API call to mark all as read
    setNotifications(prev => prev?.map(n => ({ ...n, isRead: true })));
    toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
    // Dispatch event to update notification bell
    window.dispatchEvent(new CustomEvent('notificationUpdated'));
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await MarkNotificationAsRead([notificationId]);
      if (res.isSuccess && Number(res.statusCode) === 200) {
        setNotifications(prev => 
          prev?.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        toast.success(res.message);
        // Dispatch event to update notification bell
        window.dispatchEvent(new CustomEvent('notificationUpdated'));
      } else {
        toast.error(res.message || "Không thể đánh dấu thông báo");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Đã xảy ra lỗi khi đánh dấu thông báo");
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
      const res = await DeleteNotification(notificationToDelete.id);
      if (res.isSuccess && Number(res.statusCode) === 200) {
        setNotifications(prev => prev?.filter(n => n.id !== notificationToDelete.id));
        toast.success("Đã xóa thông báo");
        setIsDeleteDialogOpen(false);
        setNotificationToDelete(null);
      } else {
        toast.error(res.message || "Không thể xóa thông báo");
      }
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
    switch (type.toLowerCase()) {
      case "order":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "user":
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case "stock":
        return <Package className="w-5 h-5 text-orange-500" />;
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

    // Kiểm tra nhiều trường hợp có thể chứa id sản phẩm
    if (typeof notificationData === 'object') {
      // Trường hợp 1: menuId trực tiếp
      if ('menuId' in notificationData && notificationData.menuId) {
        menuId = String(notificationData.menuId);
      }
      // Trường hợp 2: id trực tiếp
      else if ('id' in notificationData && notificationData.id) {
        menuId = String(notificationData.id);
      }
      // Trường hợp 3: productId
      else if ('productId' in notificationData && notificationData.productId) {
        menuId = String(notificationData.productId);
      }
      // Trường hợp 4: menu.id (nested object)
      else if ('menu' in notificationData && typeof notificationData.menu === 'object' && notificationData.menu !== null) {
        const menu = notificationData.menu as any;
        if ('id' in menu && menu.id) {
          menuId = String(menu.id);
        } else if ('menuId' in menu && menu.menuId) {
          menuId = String(menu.menuId);
        }
      }
    } else if (typeof notificationData === 'string') {
      // Nếu data là string, có thể đó chính là id
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold text-purple-700">
              Thông Báo
            </h1>
            <p className="text-gray-600">Quản lý tất cả thông báo hệ thống</p>
          </div>
          <Button
            onClick={handleMarkAllAsRead}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>

        {/* Notifications List */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              Danh Sách Thông Báo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Đang tải thông báo...
              </div>
            ) : notifications?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Không có thông báo nào
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
                              {notification.type?.toLowerCase() === "rating" && (
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
  );
};

export default AdminNotificationsPage;

