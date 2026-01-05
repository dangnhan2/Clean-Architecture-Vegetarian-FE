"use client";

import { useEffect, useState } from "react";
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
  Trash2
} from "lucide-react";

const AdminNotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<INotification[] | null | undefined>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<INotification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await MarkNotificationAsRead([notificationId]);
      if (res.isSuccess && Number(res.statusCode) === 200) {
        setNotifications(prev => 
          prev?.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        toast.success(res.message);
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
                {notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.isRead && (
                              <Badge variant="default" className="bg-blue-500">
                                Mới
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {new Date(notification.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
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
                ))}
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

