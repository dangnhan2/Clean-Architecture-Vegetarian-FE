"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { EditFoodItem } from "@/services/api";

const productSchema = z.object({
    name: z.string().min(1, {
        message: "Tên món ăn không được để trống.",
    }),
    category: z.string().min(1, {
        message: "Vui lòng chọn danh mục.",
    }),
    description: z.string().optional(),
    originalPrice: z.number().min(1, {
        message: "Giá gốc phải lớn hơn 0.",
    }),
    discountPrice: z.number().min(0, {
        message: "Giá khuyến mãi không được âm.",
    }),
    thumbnail: z.instanceof(File).optional(),
    isAvailable: z.boolean(),
    isOnSale: z.boolean(),
}).refine((data) => {
    if (data.isOnSale && data.discountPrice >= data.originalPrice) {
        return false;
    }
    return true;
}, {
    message: "Giá khuyến mãi phải nhỏ hơn giá gốc.",
    path: ["discountPrice"],
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductEditingFormProps {
    product: IFoodItem;
    categories: ICategory[] | null | undefined;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const ProductEditingForm = ({ product, categories, onSuccess, onCancel }: ProductEditingFormProps) => {
    const [imagePreview, setImagePreview] = useState<string>(product.imageUrl);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasNewImage, setHasNewImage] = useState(false);

    // Tìm category ID từ category name
    const getCategoryId = () => {
        const category = categories?.find(cat => cat.name === product.category);
        return category?.id || "";
    };

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: product.name,
            category: getCategoryId(),
            description: product.description || "",
            originalPrice: product.originalPrice,
            discountPrice: product.discountPrice || 0,
            thumbnail: undefined,
            isAvailable: product.isAvailable,
            isOnSale: product.isOnSale,
        },
    });

    const imageFile = form.watch("thumbnail");
    const isOnSale = form.watch("isOnSale");

    // Update image preview when image file changes
    useEffect(() => {
        if (imageFile) {
            // Cleanup preview cũ
            if (imagePreview && imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
            const previewUrl = URL.createObjectURL(imageFile);
            setImagePreview(previewUrl);
            setHasNewImage(true);
        } else if (!hasNewImage) {
            // Nếu không có ảnh mới, hiển thị ảnh cũ
            setImagePreview(product.imageUrl);
        }
    }, [imageFile]);

    // Cleanup preview URL khi component unmount
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleSubmit = async (values: ProductFormValues) => {
        console.log(values);
        setIsSubmitting(true);
        try {
            // Convert empty description to null/undefined
            const description = values.description?.trim() || null;
            
            // Gọi API EditFoodItem - chỉ gửi thumbnail nếu có
            const res = await EditFoodItem(
                product.id,
                values.name,
                values.category,
                description,
                values.originalPrice,
                values.discountPrice,
                values.isAvailable,
                values.isOnSale,
                values.thumbnail,
            );

            if (res.isSuccess && (Number(res.statusCode) === 200 || Number(res.statusCode) === 201)) {
                toast.success("Cập nhật món ăn thành công!");
                if (imagePreview && imagePreview.startsWith("blob:")) {
                    URL.revokeObjectURL(imagePreview);
                }
                // Gọi callback onSuccess nếu có
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast.error(res.message || "Không thể cập nhật món ăn");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Đã xảy ra lỗi khi cập nhật món ăn");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClearImage = () => {
        form.setValue("thumbnail", undefined as any);
        if (imagePreview && imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(product.imageUrl);
        setHasNewImage(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên món ăn *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Nhập tên món ăn"
                                            className="bg-white"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Category Field */}
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Danh mục *</FormLabel>
                                    <FormControl>
                                        <select
                                            {...field}
                                            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        >
                                            <option value="">Chọn danh mục</option>
                                            {categories?.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description Field */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mô tả</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Nhập mô tả món ăn (tùy chọn)"
                                            className="bg-white min-h-[100px]"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Price Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="originalPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giá gốc (VNĐ) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                className="bg-white"
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="discountPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giá khuyến mãi (VNĐ)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                className="bg-white"
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Checkboxes */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="isAvailable"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 p-4 bg-white">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="cursor-pointer">
                                                Đang bán
                                            </FormLabel>
                                            <p className="text-sm text-gray-500">
                                                Món ăn sẽ hiển thị cho khách hàng
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isOnSale"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 p-4 bg-white">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="cursor-pointer">
                                                Đang khuyến mãi
                                            </FormLabel>
                                            <p className="text-sm text-gray-500">
                                                Áp dụng giá khuyến mãi cho món ăn này
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Right Column - Image Upload & Preview */}
                    <div className="space-y-6">
                        {/* Image Upload Field */}
                        <FormField
                            control={form.control}
                            name="thumbnail"
                            render={({ field: { onChange } }) => (
                                <FormItem>
                                    <FormLabel>Hình ảnh món ăn</FormLabel>
                                    <FormControl>
                                        <div className="space-y-4">
                                            {/* Image Preview */}
                                            <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                                                {imagePreview ? (
                                                    <>
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-gray-400 p-8">
                                                        <Upload className="h-12 w-12 mb-2" />
                                                        <p className="text-sm text-center">
                                                            Chọn hình ảnh để xem trước
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Upload Button */}
                                            <Button
                                                type="button"
                                                className="w-full"
                                                onClick={() => document.getElementById("imageUploadEdit")?.click()}
                                            >
                                                <Upload className="h-4 w-4 mr-2" />
                                                {hasNewImage ? "Thay đổi ảnh" : "Chọn ảnh mới"}
                                            </Button>

                                            {/* Clear Button */}
                                            {hasNewImage && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleClearImage}
                                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Hủy thay đổi ảnh
                                                </Button>
                                            )}

                                            {/* Hidden file input */}
                                            <input
                                                id="imageUploadEdit"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        onChange(file); // update form value
                                                    }
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                    )}
                    <Button
                        type="submit"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Đang cập nhật..." : "Cập nhật món ăn"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default ProductEditingForm;

