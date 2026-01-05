"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { GetFoodItems, GetFoodItemById, GetCategories, DeleteFoodItem, GetCategoriesByAdmin, GetFoodItemsByAdmin } from "@/services/api";
import { useEffect, useState } from "react";
import PaginationControl from "@/components/common/PaginationControl";
import ProductDetail from "@/components/admin/products/ProductDetail";
import ProductCreatingForm from "@/components/admin/products/ProductCreatingForm";
import ProductEditingForm from "@/components/admin/products/ProductEditingForm";
import { toast } from "sonner";

const AdminProductsPage = () => {
    const [items, setItems] = useState<IFoodItem[] | null | undefined>();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState<IFoodItem | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [categories, setCategories] = useState<ICategory[] | null | undefined>();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<IFoodItem | null>(null);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<IFoodItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const fetchFoodItems = async () => {
        let query = `page=${page}&pageSize=${pageSize}`
        
        if(searchText !== ""){
            query += `&search=${searchText}`
        }

        let res = await GetFoodItemsByAdmin(query);
       
        // console.log(res);
        if (res.isSuccess && Number(res.statusCode) === 200) {
            if (res?.data) {
                setItems(res.data.data);
                setTotal(res.data.total || 0);
            }
        }
    }

    const fetchCategories = async () => {
        let res = await GetCategoriesByAdmin();
        if (res.isSuccess && Number(res.statusCode) === 200) {
            setCategories(res.data);
        }
    }

    useEffect(() => {
        fetchFoodItems();
    }, [page, pageSize, searchText]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleViewProduct = async (productId: string) => {
        setIsLoadingDetail(true);
        const res = await GetFoodItemById(productId);
        if (res.isSuccess && Number(res.statusCode) === 200) {
            if (res?.data) {
                setSelectedProduct(res.data);
                setIsDetailDialogOpen(true);
            }
        } else {
            toast.error(res.message || "Không thể tải thông tin sản phẩm");
        }
        setIsLoadingDetail(false);
    };

    const handleCreateSuccess = async () => {
        setIsCreateDialogOpen(false);
        // Refresh danh sách
        await fetchFoodItems();
    };

    const handleEditProduct = async (productId: string) => {
        setIsLoadingEdit(true);
        const res = await GetFoodItemById(productId);
        if (res.isSuccess && Number(res.statusCode) === 200) {
            if (res?.data) {
                setProductToEdit(res.data);
                setIsEditDialogOpen(true);
            }
        } else {
            toast.error(res.message || "Không thể tải thông tin sản phẩm");
        }
        setIsLoadingEdit(false);
    };

    const handleEditSuccess = async () => {
        setIsEditDialogOpen(false);
        setProductToEdit(null);
        // Refresh danh sách
        await fetchFoodItems();
    };

    const handleDeleteClick = (product: IFoodItem) => {
        setProductToDelete(product);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;

        setIsDeleting(true);
        try {
            const res = await DeleteFoodItem(productToDelete.id);
            if (res.isSuccess && Number(res.statusCode) === 200) {
                toast.success("Xóa món ăn thành công");
                setIsDeleteDialogOpen(false);
                setProductToDelete(null);
                // Refresh danh sách
                await fetchFoodItems();
            } else {
                toast.error(res.message || "Không thể xóa món ăn");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi xóa món ăn");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10">
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-purple-700">Quản Lý Món Ăn</h1>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="w-full sm:w-72">
                            <Input
                                placeholder="Tìm kiếm món ăn..."
                                className="bg-white"
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    // Reset category khi user nhập vào search
                                    if (selectedCategory !== "") {
                                        setSelectedCategory("");
                                    }
                                }}
                            />
                        </div>
                        <select 
                            className="w-full sm:w-48 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            value={selectedCategory}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSelectedCategory(value);
                                if (value && value !== "") {
                                    // Tìm category name từ id
                                    const category = categories?.find(cat => cat.id === value);
                                    setSearchText(category?.name || "");
                                } else {
                                    setSearchText("");
                                }
                            }}
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories?.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        + Thêm Món Mới
                    </Button>
                </div>

                {/* Table */}
                <Card className="shadow-sm border border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-800">Danh Sách Món Ăn</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="grid grid-cols-[1.2fr_2fr_2.4fr_1.1fr_1fr_0.9fr_1.4fr] gap-3 px-4 py-3 text-sm font-semibold text-gray-500 border-b bg-white">
                            <span className="text-left">Hình ảnh</span>
                            <span className="text-left">Tên món</span>
                            <span className="text-left">Mô tả</span>
                            <span className="text-center">Danh mục</span>
                            <span className="text-right">Giá</span>
                            <span className="text-right">Đã bán</span>
                            <span className="text-right">Hành động</span>
                        </div>

                        <div className="divide-y">
                            {items?.map((item) => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-[1.2fr_2fr_2.4fr_1.1fr_1fr_0.9fr_1.4fr] gap-3 px-4 py-4 items-center bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-16 w-20 overflow-hidden rounded-lg border">
                                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <span className="font-semibold text-gray-900 truncate">{item.name}</span>
                                        <div className="flex gap-2 flex-wrap">
                                            <Badge
                                                variant={item.isAvailable ? "default" : "secondary"}
                                                className={item.isAvailable ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-100"}
                                            >
                                                {item.isAvailable ? "Đang bán" : "Ngừng bán"}
                                            </Badge>
                                            {item.isOnSale && (
                                                <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">Đang khuyến mãi</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-2">{item.description}</p>
                                    <div className="flex items-center justify-center">
                                        <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">{item.category}</Badge>
                                    </div>
                                    <div className="text-purple-700 font-semibold text-right tabular-nums">
                                        {(item.discountPrice > 0 ? item.discountPrice : item.originalPrice).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                    </div>
                                    <div className="text-gray-700 font-semibold text-right tabular-nums">{item.soldQuantity}</div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                            onClick={() => handleViewProduct(item.id)}
                                            disabled={isLoadingDetail}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-gray-700 hover:bg-gray-100"
                                            onClick={() => handleEditProduct(item.id)}
                                            disabled={isLoadingEdit}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            className="bg-red-500 hover:bg-red-600"
                                            onClick={() => handleDeleteClick(item)}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
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

                {/* Product Detail Dialog */}
                <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Chi Tiết Sản Phẩm</DialogTitle>
                        </DialogHeader>
                        {selectedProduct && (
                            <ProductDetail product={selectedProduct} />
                        )}
                    </DialogContent>
                </Dialog>

                {/* Create Product Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Tạo Món Ăn Mới</DialogTitle>
                        </DialogHeader>

                        <ProductCreatingForm
                            categories={categories}
                            onSuccess={handleCreateSuccess}
                            onCancel={() => setIsCreateDialogOpen(false)}
                        />

                    </DialogContent>
                </Dialog>

                {/* Edit Product Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Chỉnh Sửa Món Ăn</DialogTitle>
                        </DialogHeader>
                        {productToEdit && categories && categories.length > 0 ? (
                            <ProductEditingForm
                                product={productToEdit}
                                categories={categories}
                                onSuccess={handleEditSuccess}
                                onCancel={() => {
                                    setIsEditDialogOpen(false);
                                    setProductToEdit(null);
                                }}
                            />
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                Đang tải thông tin sản phẩm...
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa món ăn</DialogTitle>
                            <DialogDescription>
                                Bạn có chắc chắn muốn xóa món ăn <strong>{productToDelete?.name}</strong>? Hành động này không thể hoàn tác.
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

export default AdminProductsPage;