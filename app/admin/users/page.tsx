
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GetUsers } from "@/services/api";
import PaginationControl from "@/components/common/PaginationControl";


const AdminUsersPage = () => {
    const [users, setUsers] = useState<IUser[] | null | undefined>();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState("");
    const [isDetailOpen, setIsDetailOpen] = useState(false);


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

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10">
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-purple-700">Quản Lý Người Dùng</h1>
                    <p className="text-gray-600">Giao diện được thiết kế tương tự trang quản lý món ăn.</p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="w-full md:w-80">
                        <Input
                            placeholder="Tìm kiếm theo tên, email, SĐT..."
                            className="bg-white"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="shadow-sm border border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-800">Danh Sách Người Dùng</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 overflow-x-auto">
                        <div className="min-w-[900px]">
                            <div className="grid grid-cols-[1.1fr_1.8fr_1.4fr_1.8fr_1.4fr_1.1fr] gap-3 px-4 py-3 text-sm font-semibold text-gray-500 border-b bg-white">
                                <span className="text-left">Ảnh đại diện</span>
                                <span className="text-left">Họ tên</span>
                                <span className="text-left">Số điện thoại</span>
                                <span className="text-left">Email</span>
                                <span className="text-right">Hành động</span>
                            </div>

                            <div className="divide-y">
                                {users?.map((user) => (
                                    <div
                                        key={user.id}
                                        className="grid grid-cols-[1.1fr_1.8fr_1.4fr_1.8fr_1.4fr_1.1fr] gap-3 px-4 py-4 items-center bg-white hover:bg-gray-50 transition-colors text-sm"
                                    >
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
                                        </div>
                                        <div className="font-semibold text-gray-900">{user.userName}</div>
                                        <div className="text-gray-700">{user.phoneNumber || "--"}</div>
                                        <div className="text-gray-700 truncate">{user.email}</div>                         
                                        <div className="flex items-center gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                                // onClick={() => handleViewUser(user)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-700 hover:bg-gray-100"
                                                // onClick={handleEditUser}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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

                {/* <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Thông tin người dùng</DialogTitle>
                        </DialogHeader>
                        {selectedUser ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative h-14 w-14 overflow-hidden rounded-full border">
                                        <Image
                                            src={selectedUser.imageUrl || "https://placehold.co/96x96"}
                                            alt={selectedUser.fullName}
                                            fill
                                            className="object-cover"
                                            sizes="56px"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-gray-900">{selectedUser.fullName}</p>
                                        <p className="text-sm text-gray-600">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                        <p className="text-gray-500">Số điện thoại</p>
                                        <p className="font-semibold text-gray-800">{selectedUser.phoneNumber || "--"}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                        <p className="text-gray-500">Mã người dùng</p>
                                        <p className="font-semibold text-gray-800">{selectedUser.id}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">Không tìm thấy thông tin người dùng.</p>
                        )}
                    </DialogContent>
                </Dialog> */}
            </div>
        </div>
    );
};

export default AdminUsersPage;

