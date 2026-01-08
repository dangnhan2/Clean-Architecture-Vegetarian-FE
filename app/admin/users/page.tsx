
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Ban, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GetUsers, BanUser, UnbanUser } from "@/services/api";
import PaginationControl from "@/components/common/PaginationControl";


const AdminUsersPage = () => {
    const [users, setUsers] = useState<IUser[] | null | undefined>();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState("");
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<"ban" | "unban" | null>(null);
    const [confirmUserId, setConfirmUserId] = useState<string | null>(null);

    const formatCurrency = (value: number) => {
        return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    };


    const fetchUsers = async () => {
        let query = `page=${page}&pageSize=${pageSize}`

        if(searchText !== ""){
            query += `&search=${searchText}`
        }

        let res = await GetUsers(query);
        if (res.isSuccess && Number(res.statusCode) === 200) {
            if (res?.data) {
                setUsers(res.data.data);
                setTotal(res.data.total || 0);
            }
        }
    }

    useEffect(() => {
        fetchUsers();
    }, [page, pageSize, searchText]);

    const handleViewUser = (user: IUser) => {
        setSelectedUser(user);
        setIsDetailOpen(true);
    };

    const handleBanUserClick = (userId: string) => {
        setConfirmUserId(userId);
        setConfirmAction("ban");
        setIsConfirmOpen(true);
    };

    const handleUnbanUserClick = (userId: string) => {
        setConfirmUserId(userId);
        setConfirmAction("unban");
        setIsConfirmOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!confirmUserId || !confirmAction) return;

        try {
            setLoadingUserId(confirmUserId);
            setIsConfirmOpen(false);
            
            let res;
            if (confirmAction === "ban") {
                res = await BanUser(confirmUserId);
            } else {
                res = await UnbanUser(confirmUserId);
            }

            if (res.isSuccess && Number(res.statusCode) === 200) {
                toast.success(
                    confirmAction === "ban" 
                        ? "Đã khóa tài khoản thành công" 
                        : "Đã mở khóa tài khoản thành công"
                );
                await fetchUsers();
                if (selectedUser?.id === confirmUserId) {
                    setSelectedUser({ 
                        ...selectedUser, 
                        isActive: confirmAction === "unban" 
                    });
                }
            } else {
                toast.error(res.message || `Không thể ${confirmAction === "ban" ? "khóa" : "mở khóa"} tài khoản`);
            }
        } catch (error) {
            toast.error(`Có lỗi xảy ra khi ${confirmAction === "ban" ? "khóa" : "mở khóa"} tài khoản`);
        } finally {
            setLoadingUserId(null);
            setConfirmUserId(null);
            setConfirmAction(null);
        }
    };

    const handleCancelConfirm = () => {
        setIsConfirmOpen(false);
        setConfirmUserId(null);
        setConfirmAction(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-4 md:p-6 lg:p-10">
            <div className="flex flex-col gap-4 md:gap-6 max-w-6xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-700">Quản Lý Người Dùng</h1>
                    <p className="text-sm md:text-base text-gray-600">Giao diện được thiết kế tương tự trang quản lý món ăn.</p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="w-full md:w-80">
                        <Input
                            placeholder="Tìm kiếm theo tên, email, SĐT..."
                            className="bg-white text-sm md:text-base"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="shadow-sm border border-gray-100">
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-base md:text-lg text-gray-800">Danh Sách Người Dùng</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 overflow-x-auto">
                        {/* Desktop/Tablet View */}
                        <div className="hidden md:block min-w-[1000px]">
                            <div className="grid grid-cols-[1fr_1.5fr_1.2fr_1.8fr_1.2fr_1.2fr_1.2fr_1.5fr] gap-3 px-4 md:px-6 py-3 text-xs md:text-sm font-semibold text-gray-500 border-b bg-white">
                                <span className="text-left">Ảnh</span>
                                <span className="text-left">Họ tên</span>
                                <span className="text-left">SĐT</span>
                                <span className="text-left">Email</span>
                                <span className="text-right">Tháng</span>
                                <span className="text-right">Năm</span>
                                <span className="text-center">Trạng thái</span>
                                <span className="text-right">Hành động</span>
                            </div>

                            <div className="divide-y">
                                {users?.map((user) => (
                                    <div
                                        key={user.id}
                                        className="grid grid-cols-[1fr_1.5fr_1.2fr_1.8fr_1.2fr_1.2fr_1.2fr_1.5fr] gap-3 px-4 md:px-6 py-3 md:py-4 items-center bg-white hover:bg-gray-50 transition-colors text-xs md:text-sm"
                                    >
                                        <div className="flex items-center">
                                            <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full border">
                                                <Image
                                                    src={user.imageUrl || "https://placehold.co/96x96"}
                                                    alt={user.userName}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 40px, 48px"
                                                />
                                            </div>
                                        </div>
                                        <div className="font-semibold text-gray-900 truncate">{user.userName}</div>
                                        <div className="text-gray-700 truncate">{user.phoneNumber || "--"}</div>
                                        <div className="text-gray-700 truncate">{user.email}</div>
                                        <div className="text-right text-gray-700 font-medium">
                                            {formatCurrency(user.totalAmountInMonth || 0)}
                                        </div>
                                        <div className="text-right text-gray-700 font-medium">
                                            {formatCurrency(user.totalAmountInYear || 0)}
                                        </div>
                                        <div className="flex justify-center">
                                            <Badge 
                                                variant={user.isActive ? "default" : "destructive"}
                                                className={user.isActive ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                                            >
                                                {user.isActive ? "Hoạt động" : "Bị khóa"}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-purple-200 text-purple-700 hover:bg-purple-50 h-8 w-8 p-0"
                                                onClick={() => handleViewUser(user)}
                                            >
                                                <Eye className="h-3 w-3 md:h-4 md:w-4" />
                                            </Button>
                                            {user.isActive ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                                    onClick={() => handleBanUserClick(user.id!)}
                                                    disabled={loadingUserId === user.id}
                                                >
                                                    {loadingUserId === user.id ? (
                                                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                                    ) : (
                                                        <Ban className="h-3 w-3 md:h-4 md:w-4" />
                                                    )}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-green-200 text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                                                    onClick={() => handleUnbanUserClick(user.id!)}
                                                    disabled={loadingUserId === user.id}
                                                >
                                                    {loadingUserId === user.id ? (
                                                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-3 p-4">
                            {users?.map((user) => (
                                <Card key={user.id} className="p-4">
                                    <div className="space-y-3">
                                        {/* Header with Avatar and Name */}
                                        <div className="flex items-center gap-3">
                                            <div className="relative h-12 w-12 overflow-hidden rounded-full border">
                                                <Image
                                                    src={user.imageUrl || "https://placehold.co/96x96"}
                                                    alt={user.userName}
                                                    fill
                                                    className="object-cover"
                                                    sizes="48px"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">{user.userName}</h3>
                                                <Badge 
                                                    variant={user.isActive ? "default" : "destructive"}
                                                    className={`mt-1 text-xs ${user.isActive ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                                                >
                                                    {user.isActive ? "Hoạt động" : "Bị khóa"}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* User Info */}
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="font-medium text-gray-900 truncate">{user.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Số điện thoại</p>
                                                <p className="font-medium text-gray-900">{user.phoneNumber || "--"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Tổng tháng</p>
                                                <p className="font-medium text-gray-900">{formatCurrency(user.totalAmountInMonth || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Tổng năm</p>
                                                <p className="font-medium text-gray-900">{formatCurrency(user.totalAmountInYear || 0)}</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                                                onClick={() => handleViewUser(user)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Xem chi tiết
                                            </Button>
                                            {user.isActive ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                                                    onClick={() => handleBanUserClick(user.id!)}
                                                    disabled={loadingUserId === user.id}
                                                >
                                                    {loadingUserId === user.id ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Ban className="h-4 w-4 mr-2" />
                                                    )}
                                                    Khóa
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                                                    onClick={() => handleUnbanUserClick(user.id!)}
                                                    disabled={loadingUserId === user.id}
                                                >
                                                    {loadingUserId === user.id ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    )}
                                                    Mở khóa
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </CardContent>

                    <PaginationControl
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={setPage}
                        className="mt-8"
                    />
                </Card>

                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-lg md:text-xl">Thông tin người dùng</DialogTitle>
                        </DialogHeader>
                        {selectedUser ? (
                            <div className="space-y-4 md:space-y-6">
                                {/* User Header */}
                                <div className="flex items-center gap-4">
                                    <div className="relative h-16 w-16 md:h-20 md:w-20 overflow-hidden rounded-full border">
                                        <Image
                                            src={selectedUser.imageUrl || "https://placehold.co/96x96"}
                                            alt={selectedUser.userName}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 64px, 80px"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base md:text-lg font-semibold text-gray-900 truncate">{selectedUser.userName}</p>
                                        <p className="text-sm md:text-base text-gray-600 truncate">{selectedUser.email}</p>
                                        <Badge 
                                            variant={selectedUser.isActive ? "default" : "destructive"}
                                            className={`mt-2 ${selectedUser.isActive ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                                        >
                                            {selectedUser.isActive ? "Hoạt động" : "Bị khóa"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* User Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    <div className="p-3 md:p-4 rounded-lg bg-gray-50 border border-gray-100">
                                        <p className="text-xs md:text-sm text-gray-500 mb-1">Mã người dùng</p>
                                        <p className="font-semibold text-sm md:text-base text-gray-800 break-all">{selectedUser.id || "--"}</p>
                                    </div>
                                    <div className="p-3 md:p-4 rounded-lg bg-gray-50 border border-gray-100">
                                        <p className="text-xs md:text-sm text-gray-500 mb-1">Số điện thoại</p>
                                        <p className="font-semibold text-sm md:text-base text-gray-800">{selectedUser.phoneNumber || "--"}</p>
                                    </div>
                                    <div className="p-3 md:p-4 rounded-lg bg-gray-50 border border-gray-100">
                                        <p className="text-xs md:text-sm text-gray-500 mb-1">Tổng tiền trong tháng</p>
                                        <p className="font-semibold text-sm md:text-base text-gray-800">{formatCurrency(selectedUser.totalAmountInMonth || 0)}</p>
                                    </div>
                                    <div className="p-3 md:p-4 rounded-lg bg-gray-50 border border-gray-100">
                                        <p className="text-xs md:text-sm text-gray-500 mb-1">Tổng tiền trong năm</p>
                                        <p className="font-semibold text-sm md:text-base text-gray-800">{formatCurrency(selectedUser.totalAmountInYear || 0)}</p>
                                    </div>
                                    <div className="p-3 md:p-4 rounded-lg bg-gray-50 border border-gray-100">
                                        <p className="text-xs md:text-sm text-gray-500 mb-1">Vai trò</p>
                                        <p className="font-semibold text-sm md:text-base text-gray-800">{selectedUser.role || "Người dùng"}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                                    {selectedUser.isActive ? (
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                setIsDetailOpen(false);
                                                handleBanUserClick(selectedUser.id!);
                                            }}
                                            disabled={loadingUserId === selectedUser.id}
                                        >
                                            {loadingUserId === selectedUser.id ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Ban className="h-4 w-4 mr-2" />
                                            )}
                                            Khóa tài khoản
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                                            onClick={() => {
                                                setIsDetailOpen(false);
                                                handleUnbanUserClick(selectedUser.id!);
                                            }}
                                            disabled={loadingUserId === selectedUser.id}
                                        >
                                            {loadingUserId === selectedUser.id ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                            )}
                                            Mở khóa tài khoản
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">Không tìm thấy thông tin người dùng.</p>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Confirmation Dialog */}
                <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg md:text-xl">
                                {confirmAction === "ban" ? "Xác nhận khóa tài khoản" : "Xác nhận mở khóa tài khoản"}
                            </DialogTitle>
                            <DialogDescription className="text-sm md:text-base">
                                {confirmAction === "ban" 
                                    ? "Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập sau khi bị khóa."
                                    : "Bạn có chắc chắn muốn mở khóa tài khoản này? Người dùng sẽ có thể đăng nhập lại sau khi mở khóa."
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={handleCancelConfirm}
                                className="w-full sm:w-auto"
                                disabled={loadingUserId !== null}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant={confirmAction === "ban" ? "destructive" : "default"}
                                onClick={handleConfirmAction}
                                className={`w-full sm:w-auto ${
                                    confirmAction === "ban" 
                                        ? "bg-red-600 hover:bg-red-700" 
                                        : "bg-green-600 hover:bg-green-700"
                                }`}
                                disabled={loadingUserId !== null}
                            >
                                {loadingUserId !== null ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    confirmAction === "ban" ? "Khóa tài khoản" : "Mở khóa tài khoản"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminUsersPage;

