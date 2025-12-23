"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { GetCategories, DeleteCategory } from "@/services/api";
import { useEffect, useState } from "react";
import CategoryCreatingForm from "@/components/admin/categories/CategoryCreatingForm";
import CategoryEditingForm from "@/components/admin/categories/CategoryEditingForm";
import { toast } from "sonner";

const AdminCategoriesPage = () => {
    const [categories, setCategories] = useState<ICategory[] | null | undefined>();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<ICategory | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<ICategory | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCategories = async () => {
        const res = await GetCategories();
        if (res.isSuccess && Number(res.statusCode) === 200) {
            setCategories(res.data);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateSuccess = async () => {
        setIsCreateDialogOpen(false);
        // Refresh danh sách
        await fetchCategories();
    };

    const handleEditClick = (category: ICategory) => {
        setCategoryToEdit(category);
        setIsEditDialogOpen(true);
    };

    const handleEditSuccess = async () => {
        setIsEditDialogOpen(false);
        setCategoryToEdit(null);
        // Refresh danh sách
        await fetchCategories();
    };

    const handleDeleteClick = (category: ICategory) => {
        setCategoryToDelete(category);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;

        setIsDeleting(true);
        try {
            const res = await DeleteCategory(categoryToDelete.id);
            if (res.isSuccess && Number(res.statusCode) === 200) {
                toast.success("Xóa danh mục thành công");
                setIsDeleteDialogOpen(false);
                setCategoryToDelete(null);
                // Refresh danh sách
                await fetchCategories();
            } else {
                toast.error(res.message || "Không thể xóa danh mục");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi xóa danh mục");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setIsDeleteDialogOpen(false);
        setCategoryToDelete(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white p-6 md:p-10">
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-purple-700">Quản Lý Danh Mục</h1>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="w-full sm:w-72">
                            <Input
                                placeholder="Tìm kiếm danh mục..."
                                className="bg-white"
                            />
                        </div>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        + Thêm Danh Mục Mới
                    </Button>
                </div>

                {/* Table */}
                <Card className="shadow-sm border border-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-800">Danh Sách Danh Mục</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="grid grid-cols-3 gap-4 px-6 py-3 text-sm font-semibold text-gray-500 border-b bg-white">
                            <span className="text-left">ID</span>
                            <span className="text-left">Tên danh mục</span>
                            <span className="text-right">Hành động</span>
                        </div>

                        <div className="divide-y">
                            {categories?.map((category) => (
                                <div
                                    key={category.id}
                                    className="grid grid-cols-3 gap-4 px-6 py-4 items-center bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="text-gray-700 font-mono text-sm truncate">
                                        {category.id}
                                    </div>
                                    <div className="text-gray-900 font-semibold">
                                        {category.name}
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-gray-700 hover:bg-gray-100"
                                            onClick={() => handleEditClick(category)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            className="bg-red-500 hover:bg-red-600"
                                            onClick={() => handleDeleteClick(category)}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Create Category Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Tạo Danh Mục Mới</DialogTitle>
                        </DialogHeader>

                        <CategoryCreatingForm
                            onSuccess={handleCreateSuccess}
                            onCancel={() => setIsCreateDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* Edit Category Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Chỉnh Sửa Danh Mục</DialogTitle>
                        </DialogHeader>
                        {categoryToEdit ? (
                            <CategoryEditingForm
                                category={categoryToEdit}
                                onSuccess={handleEditSuccess}
                                onCancel={() => {
                                    setIsEditDialogOpen(false);
                                    setCategoryToEdit(null);
                                }}
                            />
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                Đang tải thông tin danh mục...
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa danh mục</DialogTitle>
                            <DialogDescription>
                                Bạn có chắc chắn muốn xóa danh mục <strong>{categoryToDelete?.name}</strong>? Hành động này không thể hoàn tác.
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

export default AdminCategoriesPage;
