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
import { AddCategory } from "@/services/api";

const categorySchema = z.object({
    name: z.string().min(1, {
        message: "Tên danh mục không được để trống.",
    }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryCreatingFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CategoryCreatingForm = ({ onSuccess, onCancel }: CategoryCreatingFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
        },
    });

    const handleSubmit = async (values: CategoryFormValues) => {
        setIsSubmitting(true);
        try {
            const res = await AddCategory(values.name);
            if (res.isSuccess && Number(res.statusCode) === 201) {
                toast.success("Tạo danh mục thành công");
                form.reset();
                onSuccess?.();
            } else {
                toast.error(res.message || "Không thể tạo danh mục");
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tạo danh mục");
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
                        {isSubmitting ? "Đang tạo..." : "Tạo danh mục"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default CategoryCreatingForm;

