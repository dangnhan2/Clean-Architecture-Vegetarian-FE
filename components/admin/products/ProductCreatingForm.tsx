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
import { CreateFoodItem } from "@/services/api";

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
    thumbnail: z.instanceof(File, {
        message: "Vui lòng chọn hình ảnh.",
    }),
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

interface ProductCreatingFormProps {
    categories: ICategory[] | null | undefined;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const ProductCreatingForm = ({ categories, onSuccess, onCancel }: ProductCreatingFormProps) => {
    const [imagePreview, setImagePreview] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            category: "",
            description: "",
            originalPrice: 0,
            discountPrice: 0,
            thumbnail: undefined,
            isAvailable: false,
            isOnSale: false,
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
        } else {
            if (imagePreview && imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
            setImagePreview("");
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
            
            // Gọi API CreateFoodItem
            const res = await CreateFoodItem(
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
                toast.success("Tạo món ăn thành công!");
                form.reset();
                if (imagePreview && imagePreview.startsWith("blob:")) {
                    URL.revokeObjectURL(imagePreview);
                }
                setImagePreview("");
                // Gọi callback onSuccess nếu có
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast.error(res.message || "Không thể tạo món ăn");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Đã xảy ra lỗi khi tạo món ăn");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClearImage = () => {
        form.setValue("thumbnail", undefined as any);
        if (imagePreview && imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview("");
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
                                        <div className="relative">
                                            <select
                                                {...field}
                                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 h-10 appearance-none"
                                            >
                                                <option value="">Chọn danh mục</option>
                                                {categories?.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                disabled={!isOnSale}
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
                                    <FormLabel>Hình ảnh món ăn *</FormLabel>
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
                                                onClick={() => document.getElementById("imageUpload")?.click()}
                                            >
                                                <Upload className="h-4 w-4 mr-2" />
                                                Chọn ảnh
                                            </Button>

                                            {/* Clear Button */}
                                            {imagePreview && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleClearImage}
                                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Xóa hình ảnh
                                                </Button>
                                            )}

                                            {/* Hidden file input */}
                                            <input
                                                id="imageUpload"
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
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            Hủy
                        </Button>
                    )}
                    <Button
                        type="submit"
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Đang tạo..." : "Tạo món ăn"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default ProductCreatingForm;

