"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ShoppingBag, UtensilsCrossed, Users, TrendingUp, CheckCircle2, XCircle, Calendar, Trophy } from "lucide-react";

interface DashboardProps {
    data: IDashboard;
}

const Dashboard = ({ data }: DashboardProps) => {
    const formatCurrency = (value: number) => {
        return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10">
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-purple-700">Tổng Quan Dashboard</h1>
                    <p className="text-lg text-gray-600">Chào mừng bạn đến với bảng điều khiển quản trị</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Total Revenue Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Tổng Doanh Thu Hôm Nay</p>
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(data.revenueToday)}
                                    </p>

                                </div>
                                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Orders Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Tổng đơn hàng hôm nay</p>
                                    <p className="text-2xl font-bold">{data.totalOrdersToday}</p>
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                    <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Paid Orders Today Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Đơn đã thanh toán hôm nay</p>
                                    <p className="text-2xl font-bold">{data.paidOrdersToday}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {data.totalOrdersToday > 0 
                                            ? `${Math.round((data.paidOrdersToday / data.totalOrdersToday) * 100)}% tổng đơn`
                                            : "0% tổng đơn"}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cancelled Orders Today Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Đơn đã hủy hôm nay</p>
                                    <p className="text-2xl font-bold">{data.cancelledOrdersToday}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {data.totalOrdersToday > 0 
                                            ? `${Math.round((data.cancelledOrdersToday / data.totalOrdersToday) * 100)}% tổng đơn`
                                            : "0% tổng đơn"}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dishes Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Món Ăn</p>
                                    <p className="text-2xl font-bold">{data.totalMenuItems}</p>
                                    <p className="text-sm text-muted-foreground mt-2">Đang hoạt động</p>
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                    <UtensilsCrossed className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customers Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Khách Hàng</p>
                                    <p className="text-2xl font-bold">
                                        {data.totalCustomers.toLocaleString("vi-VN")}
                                    </p>

                                </div>
                                <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                                    <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Paid Orders Monthly Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Tổng đơn đã thanh toán tháng này</p>
                                    <p className="text-2xl font-bold">{data.totalPaidOrdersMontly}</p>
                                    <p className="text-xs text-muted-foreground mt-2">Tháng hiện tại</p>
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Revenue Monthly Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Doanh thu tháng này</p>
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(data.revenueMonthly)}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-600 font-medium">Tháng hiện tại</span>
                                    </div>
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section - Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Selling Dishes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Món Ăn Bán Chạy</CardTitle>
                            <CardDescription>Top 5 món ăn được đặt nhiều nhất</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.topSellingMenus && data.topSellingMenus.length > 0 ? (
                                    data.topSellingMenus.slice(0, 5).map((dish, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-purple-700 dark:text-purple-400 font-bold text-sm">{index + 1}</span>
                                            </div>
                                            <div className="relative h-12 w-12 overflow-hidden rounded-full border flex-shrink-0">
                                                <Image
                                                    src={dish.imageUrl}
                                                    alt={dish.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="48px"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{dish.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-purple-700 dark:text-purple-400 font-semibold">
                                                    {dish.soldQuantity.toLocaleString("vi-VN")} đã bán
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Users */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Khách Hàng Mua Hàng Nhiều Nhất</CardTitle>
                            <CardDescription>Top 5 khách hàng có tổng giá trị đơn hàng cao nhất trong tháng</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.topBuyers && data.topBuyers.length > 0 ? (
                                    data.topBuyers.slice(0, 5).map((user, index) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                                                {index === 0 ? (
                                                    <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                                ) : (
                                                    <span className="text-orange-700 dark:text-orange-400 font-bold text-sm">{index + 1}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{user.fullName}</p>
                                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.phoneNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-orange-700 dark:text-orange-400 font-semibold">
                                                    {formatCurrency(user.totalAmountInAMonth)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Tháng này</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

