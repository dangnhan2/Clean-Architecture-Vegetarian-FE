"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
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
import { EditVoucher } from "@/services/api";

const voucherSchema = z.object({
    code: z.string().min(1, { message: "Mã voucher không được để trống." }),
    discountType: z.string().min(1, { message: "Loại giảm không được để trống." }),
    discountValue: z.number().positive({ message: "Giá trị giảm phải lớn hơn 0." }),
    maxDiscount: z.number().nonnegative({ message: "Giảm tối đa không được âm." }),
    minOrderAmount: z.number().nonnegative({ message: "Đơn tối thiểu không được âm." }),
    startDate: z.string().min(1, { message: "Vui lòng chọn ngày bắt đầu." }),
    endDate: z.string().min(1, { message: "Vui lòng chọn ngày kết thúc." }),
    usageLimit: z.number().min(1, { message: "Giới hạn sử dụng tối thiểu là 1." }),
    perUserLimit: z.number().min(1, { message: "Giới hạn mỗi người dùng tối thiểu là 1." }),
    isActive: z.boolean(),
}).refine((data) => {
    if (data.discountType === "percent") {
        return data.discountValue <= 100;
    }
    return true;
}, {
    message: "Giá trị phần trăm phải nhỏ hơn hoặc bằng 100%.",
    path: ["discountValue"],
}).refine((data) => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
}, {
    message: "Ngày kết thúc phải sau ngày bắt đầu.",
    path: ["endDate"],
});

type VoucherFormValues = z.infer<typeof voucherSchema>;

interface VoucherEditingFormProps {
    voucher: IVoucher | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const formatDateForInput = (value: string) => {
    if (!value) return "";
    
    let date: Date;
    
    // Try to parse different date formats
    // Format 1: "MM/DD/YYYY HH:mm:ss" (from API)
    const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    const match = value.match(mmddyyyyPattern);
    
    if (match) {
        const [, month, day, year, hours, minutes] = match;
        date = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            parseInt(hours),
            parseInt(minutes)
        );
    } else {
        // Try standard Date parsing (ISO string, etc.)
        date = new Date(value);
    }
    
    if (isNaN(date.getTime())) {
        console.warn("Invalid date format:", value);
        return "";
    }
    
    // Format to datetime-local format: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const VoucherEditingForm = ({ voucher, onSuccess, onCancel }: VoucherEditingFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<VoucherFormValues>({
        resolver: zodResolver(voucherSchema),
        defaultValues: {
            code: "",
            discountType: "percent",
            discountValue: 0,
            maxDiscount: 0,
            minOrderAmount: 0,
            startDate: "",
            endDate: "",
            usageLimit: 1,
            perUserLimit: 1,
            isActive: true,
        },
    });

    useEffect(() => {
        if (voucher) {
            form.reset({
                code: voucher.code || "",
                discountType: voucher.discountType || "percent",
                discountValue: voucher.discountValue || 0,
                maxDiscount: voucher.maxDiscount || 0,
                minOrderAmount: voucher.minOrderAmount || 0,
                startDate: formatDateForInput(voucher.startDate || ""),
                endDate: formatDateForInput(voucher.endDate || ""),
                usageLimit: voucher.usageLimit || 1,
                perUserLimit: voucher.perUserLimit || 1,
                isActive: voucher.isActive,
            });
        }
    }, [voucher]);

    const formatDateWithOffset = (dateString: string): string => {
        if (!dateString) return "";
        
        // Parse datetime-local format (YYYY-MM-DDTHH:mm)
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return dateString; // Return original if invalid
        }
        
        // Get timezone offset in minutes
        const offsetMinutes = date.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const offsetSign = offsetMinutes <= 0 ? '+' : '-';
        
        // Format: YYYY-MM-DDTHH:mm:ss+HH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const offset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
        
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
    };

    const handleSubmit = async (values: VoucherFormValues) => {
        if (!voucher?.id) return;
        setIsSubmitting(true);
        try {
            const res = await EditVoucher(
                voucher.id,
                values.code.trim(),
                values.discountType,
                values.discountValue,
                values.maxDiscount,
                values.minOrderAmount,
                formatDateWithOffset(values.startDate),
                formatDateWithOffset(values.endDate),
                values.usageLimit,
                values.perUserLimit,
                values.isActive
            );

            if (res.isSuccess && Number(res.statusCode) === 200) {
                toast.success("Cập nhật voucher thành công!");
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast.error(res.message || "Không thể cập nhật voucher");
            }
        } catch (error) {
            console.error("Error updating voucher:", error);
            toast.error("Đã xảy ra lỗi khi cập nhật voucher");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mã voucher *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="NHAPMA"
                                            className="bg-white uppercase"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="discountType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Loại giảm *</FormLabel>
                                        <FormControl>
                                            <select
                                                {...field}
                                                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                            >
                                                <option value="percent">% phần trăm</option>
                                                <option value="amount">Số tiền cố định</option>
                                            </select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="discountValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giá trị giảm *</FormLabel>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="maxDiscount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giảm tối đa (VNĐ) *</FormLabel>
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
                                name="minOrderAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Đơn tối thiểu (VNĐ) *</FormLabel>
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
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bắt đầu *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                className="bg-white"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kết thúc *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="datetime-local"
                                                className="bg-white"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="usageLimit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giới hạn sử dụng *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="1"
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
                                name="perUserLimit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giới hạn mỗi người (lần/ngày)*</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="1"
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
                                            Đang áp dụng
                                        </FormLabel>
                                        <p className="text-sm text-gray-500">
                                            Voucher sẽ có hiệu lực nếu được bật.
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

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
                        {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default VoucherEditingForm;

