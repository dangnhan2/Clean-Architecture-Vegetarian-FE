"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
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
import { toast } from "sonner";
import { UpdateCategory } from "@/services/api";

const categorySchema = z.object({
    name: z.string().min(1, {
        message: "Tên danh mục không được để trống.",
    }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryEditingFormProps {
    category: ICategory;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CategoryEditingForm = ({ category, onSuccess, onCancel }: CategoryEditingFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: category.name,
        },
    });

    const handleSubmit = async (values: CategoryFormValues) => {
        setIsSubmitting(true);
        try {
            const res = await UpdateCategory(category.id, values.name);
            if (res.isSuccess && Number(res.statusCode) === 200) {
                toast.success("Cập nhật danh mục thành công");
                onSuccess?.();
            } else {
                toast.error(res.message || "Không thể cập nhật danh mục");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi cập nhật danh mục");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên danh mục *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Nhập tên danh mục"
                                    className="bg-white"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4">
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
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Đang cập nhật..." : "Cập nhật danh mục"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default CategoryEditingForm;

