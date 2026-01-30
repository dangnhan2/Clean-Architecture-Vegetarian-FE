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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { UpdateAdvertisement } from "@/services/api";

const advertisementSchema = z.object({
    title: z.string().min(1, {
        message: "Tiêu đề không được để trống.",
    }),
    banner: z.instanceof(File).optional(),
    adTargetType: z.string().min(1, {
        message: "Vui lòng chọn loại quảng cáo.",
    }),
    targetKey: z.string().optional(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
    isActive: z.boolean(),
}).refine((data) => {
    if (data.startAt && data.startAt.trim() !== "" && data.endAt && data.endAt.trim() !== "") {
        const startDate = new Date(data.startAt);
        const endDate = new Date(data.endAt);
        return endDate >= startDate;
    }
    return true;
}, {
    message: "Ngày kết thúc phải sau ngày bắt đầu.",
    path: ["endAt"],
});

type AdvertisementFormValues = z.infer<typeof advertisementSchema>;

interface AdvertisementEditingFormProps {
    advertisement: IAdvertisement;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const AdvertisementEditingForm = ({ advertisement, onSuccess, onCancel }: AdvertisementEditingFormProps) => {
    const [imagePreview, setImagePreview] = useState<string>(advertisement.bannerUrl);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasNewImage, setHasNewImage] = useState(false);

    // Format datetime from ISO string to datetime-local format
    const formatDateTimeLocal = (isoString: string): string => {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const form = useForm<AdvertisementFormValues>({
        resolver: zodResolver(advertisementSchema),
        defaultValues: {
            title: advertisement.title,
            banner: undefined,
            adTargetType: advertisement.adTargetType,
            targetKey: advertisement.targetKey || "",
            startAt: advertisement.startAt ? formatDateTimeLocal(advertisement.startAt) : "",
            endAt: advertisement.endAt ? formatDateTimeLocal(advertisement.endAt) : "",
            isActive: advertisement.isActive,
        },
    });

    const imageFile = form.watch("banner");

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
            setImagePreview(advertisement.bannerUrl);
        }
    }, [imageFile, hasNewImage, advertisement.bannerUrl]);

    // Cleanup preview URL khi component unmount
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleSubmit = async (values: AdvertisementFormValues) => {
        setIsSubmitting(true);
        try {
            // Format datetime to ISO 8601 for DateTimeOffset
            const formatDateTime = (dateTimeLocal: string): string => {
                // Convert from "YYYY-MM-DDTHH:mm" to ISO 8601 format
                const date = new Date(dateTimeLocal);
                return date.toISOString();
            };

            // Gọi API UpdateAdvertisement
            const res = await UpdateAdvertisement(
                advertisement.id,
                values.title,
                hasNewImage ? values.banner : null,
                values.adTargetType,
                values.targetKey?.trim() || null,
                values.startAt?.trim() ? formatDateTime(values.startAt) : null,
                values.endAt?.trim() ? formatDateTime(values.endAt) : null,
                values.isActive,
            );

            if (res.isSuccess && (Number(res.statusCode) === 200 || Number(res.statusCode) === 201)) {
                toast.success("Cập nhật quảng cáo thành công!");
                // Gọi callback onSuccess nếu có
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                const errorMessage = typeof res.message === 'string' ? res.message : "Không thể cập nhật quảng cáo";
                toast.error(errorMessage);
            }
        } catch (error: any) {
            console.error("Error submitting form:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Đã xảy ra lỗi khi cập nhật quảng cáo";
            toast.error(typeof errorMessage === 'string' ? errorMessage : "Đã xảy ra lỗi khi cập nhật quảng cáo");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClearImage = () => {
        form.setValue("banner", undefined);
        setHasNewImage(false);
        if (imagePreview && imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(advertisement.bannerUrl);
    };

    // Get today's date in YYYY-MM-DD format for min date
    const today = new Date().toISOString().split('T')[0];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Title Field */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tiêu đề quảng cáo *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Nhập tiêu đề quảng cáo"
                                            className="bg-white"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Ad Target Type Field */}
                        <FormField
                            control={form.control}
                            name="adTargetType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loại quảng cáo *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <select
                                                {...field}
                                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 h-10 appearance-none"
                                            >
                                                <option value="">Chọn loại quảng cáo</option>
                                                <option value="MenuPage">Sản phẩm</option>
                                                <option value="OnSellerPage">Mặt hàng giảm giá</option>
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

                        {/* Target Key Field */}
                        <FormField
                            control={form.control}
                            name="targetKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mục tiêu</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <select
                                                {...field}
                                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 h-10 appearance-none"
                                                value={field.value || ""}
                                            >
                                                <option value="">Chọn mục tiêu (tùy chọn)</option>
                                                <option value="product">Product</option>
                                                <option value="onsale">OnSale</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    <p className="text-xs text-gray-500">
                                        Để trống nếu không cần
                                    </p>
                                </FormItem>
                            )}
                        />

                        {/* Date Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày bắt đầu</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                className="bg-white"
                                                {...field}
                                                value={field.value || ""}
                                                min={today}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-gray-500">
                                            Để trống nếu không có ngày bắt đầu
                                        </p>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày kết thúc</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                className="bg-white"
                                                {...field}
                                                value={field.value || ""}
                                                min={form.watch("startAt") || today}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-xs text-gray-500">
                                            Để trống nếu không có ngày kết thúc
                                        </p>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Checkbox */}
                        <FormField
                            control={form.control}
                            name="isActive"
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
                                            Đang hoạt động
                                        </FormLabel>
                                        <p className="text-sm text-gray-500">
                                            Quảng cáo sẽ hiển thị ngay sau khi cập nhật
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Right Column - Image Upload & Preview */}
                    <div className="space-y-6">
                        {/* Image Upload Field */}
                        <FormField
                            control={form.control}
                            name="banner"
                            render={({ field: { onChange } }) => (
                                <FormItem>
                                    <FormLabel>Hình ảnh banner</FormLabel>
                                    <FormControl>
                                        <div className="space-y-4">
                                            {/* Image Preview */}
                                            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
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
                                                            Chọn hình ảnh banner để xem trước
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Upload Button */}
                                            <Button
                                                type="button"
                                                className="w-full"
                                                onClick={() => document.getElementById("bannerUploadEdit")?.click()}
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
                                                id="bannerUploadEdit"
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
                                    <p className="text-xs text-gray-500">
                                        Để trống nếu không muốn thay đổi ảnh
                                    </p>
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
                        {isSubmitting ? "Đang cập nhật..." : "Cập nhật quảng cáo"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default AdvertisementEditingForm;

