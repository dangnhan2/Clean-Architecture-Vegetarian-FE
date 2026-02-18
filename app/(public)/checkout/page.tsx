"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, CreditCard, Tag, X, User, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/context";
import { CreateOrderWithCOD, CreateOrderWithQR, GetAddresses, GetVouchers, ValidateVoucher, AddAddress, UpdateAddress, DeleteAddress, SetAddressDefault } from "@/services/api";
import { GetProvinces, GetDistricts } from "@/services/external_api";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

const TAX_RATE = 0.08;

// Schema thêm / sửa địa chỉ
const addressSchema = z.object({
    fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
    phoneNumber: z.string().min(10, "Số điện thoại phải có ít nhất 10 số"),
    provinceId: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố"),
    districtId: z.string().min(1, "Vui lòng chọn Quận/Huyện"),
    address: z.string().min(5, "Địa chỉ chi tiết phải có ít nhất 5 ký tự"),
    isDefault: z.boolean().default(false),
});

interface AddressValues {
    fullName: string;
    phoneNumber: string;
    provinceId: string;
    districtId: string;
    address: string;
    isDefault: boolean;
}

const CheckoutPage = () => {
    const { cart, user, fetchCart } = useAuth();
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<"QR" | "COD">("QR");

    // Voucher
    const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
    const [vouchers, setVouchers] = useState<IVoucher[] | undefined>([]);
    const [appliedVoucherId, setAppliedVoucherId] = useState<string | null>(null);
    const [selectedVoucherIdInModal, setSelectedVoucherIdInModal] = useState<string | null>(null);
    const [loadingVouchers, setLoadingVouchers] = useState(false);
    const [addresses, setAddresses] = useState<IAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [voucherValidationInfo, setVoucherValidationInfo] = useState<IVoucherValidationInfo>();
    const [confirmOrderDialogOpen, setConfirmOrderDialogOpen] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const cartItems = cart?.items || [];

    // Address management
    const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
    const [isUpdateAddressOpen, setIsUpdateAddressOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [addressToUpdate, setAddressToUpdate] = useState<IAddress | null>(null);
    const [addressToDelete, setAddressToDelete] = useState<IAddress | null>(null);
    const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);

    // Provinces and Districts
    const [provinces, setProvinces] = useState<IProvinceData[]>([]);
    const [isProvincesLoading, setIsProvincesLoading] = useState(false);
    const [districtsForAdd, setDistrictsForAdd] = useState<IDistrictData[]>([]);
    const [districtsForUpdate, setDistrictsForUpdate] = useState<IDistrictData[]>([]);
    const [isDistrictsAddLoading, setIsDistrictsAddLoading] = useState(false);
    const [isDistrictsUpdateLoading, setIsDistrictsUpdateLoading] = useState(false);

    // Forms
    const addressForm = useForm<AddressValues>({
        resolver: zodResolver(addressSchema) as any,
        defaultValues: {
            fullName: "",
            phoneNumber: "",
            provinceId: "",
            districtId: "",
            address: "",
            isDefault: false,
        },
    });

    const updateAddressForm = useForm<AddressValues>({
        resolver: zodResolver(addressSchema) as any,
        defaultValues: {
            fullName: "",
            phoneNumber: "",
            provinceId: "",
            districtId: "",
            address: "",
            isDefault: false,
        },
    });

    const addProvinceId = useWatch({ control: addressForm.control, name: "provinceId" });
    const updateProvinceId = useWatch({ control: updateAddressForm.control, name: "provinceId" });

    const fetchAddresses = async () => {
        if (user?.id) {
            const res = await GetAddresses(user?.id);
            if (res.isSuccess && res.data) {
                setAddresses(res.data);
                // Auto-select default address if available
                const defaultAddress = res.data.find(a => a.isDefault);
                if (defaultAddress && !selectedAddressId) {
                    setSelectedAddressId(defaultAddress.id);
                }
            }
        }
    }

    const fetchProvinces = async () => {
        if (provinces.length > 0) return;
        setIsProvincesLoading(true);
        try {
            const res = await GetProvinces();
            const payload = res.data as unknown as IProvince;
            if (payload?.error === 0) {
                setProvinces(payload.data || []);
            } else {
                toast.error(payload?.error_text || "Không thể tải danh sách tỉnh/thành phố");
            }
        } catch (error) {
            console.error("GetProvinces error:", error);
            toast.error("Không thể tải danh sách tỉnh/thành phố");
        } finally {
            setIsProvincesLoading(false);
        }
    };

    const fetchDistricts = async (provinceId: string, mode: "add" | "update") => {
        if (!provinceId) return;
        if (mode === "add") setIsDistrictsAddLoading(true);
        else setIsDistrictsUpdateLoading(true);

        try {
            const res = await GetDistricts(provinceId);
            const payload = res.data as unknown as IDistrict;
            if (payload?.error === 0) {
                const list = payload.data || [];
                if (mode === "add") setDistrictsForAdd(list);
                else setDistrictsForUpdate(list);
            } else {
                toast.error(payload?.error_text || "Không thể tải danh sách quận/huyện");
            }
        } catch (error) {
            console.error("GetDistricts error:", error);
            toast.error("Không thể tải danh sách quận/huyện");
        } finally {
            if (mode === "add") setIsDistrictsAddLoading(false);
            else setIsDistrictsUpdateLoading(false);
        }
    };

    const handleAddAddress = async (values: AddressValues) => {
        if (user?.id) {
            const provinceName =
                provinces.find((p) => p.id === values.provinceId)?.full_name ||
                provinces.find((p) => p.id === values.provinceId)?.name ||
                "";
            const districtName =
                districtsForAdd.find((d) => d.id === values.districtId)?.full_name ||
                districtsForAdd.find((d) => d.id === values.districtId)?.name ||
                "";

            let res = await AddAddress(
                user.id,
                values.address,
                values.fullName,
                values.phoneNumber,
                provinceName,
                districtName,
                values.isDefault
            );
            if (res.isSuccess && Number(res.statusCode) === 201) {
                toast.success(res.message);
                await fetchAddresses();
                setIsAddAddressOpen(false);
                addressForm.reset();
            } else {
                toast.error(res.message);
            }
        }
    };

    const handleUpdateClick = (address: IAddress) => {
        setAddressToUpdate(address);
        updateAddressForm.reset({
            fullName: address.fullName || "",
            phoneNumber: address.phoneNumber || "",
            provinceId: "",
            districtId: "",
            address: address.address,
            isDefault: address.isDefault ?? false,
        });
        setIsUpdateAddressOpen(true);
    };

    const handleUpdateAddress = async (values: AddressValues) => {
        if (addressToUpdate?.id && user?.id) {
            const provinceName =
                provinces.find((p) => p.id === values.provinceId)?.full_name ||
                provinces.find((p) => p.id === values.provinceId)?.name ||
                "";
            const districtName =
                districtsForUpdate.find((d) => d.id === values.districtId)?.full_name ||
                districtsForUpdate.find((d) => d.id === values.districtId)?.name ||
                "";

            let res = await UpdateAddress(
                addressToUpdate.id,
                user.id,
                values.address,
                values.fullName,
                values.phoneNumber,
                provinceName,
                districtName,
                values.isDefault
            );
            if (res.isSuccess && Number(res.statusCode) === 200) {
                toast.success(res.message);
                await fetchAddresses();
                setIsUpdateAddressOpen(false);
                setAddressToUpdate(null);
                updateAddressForm.reset();
            } else {
                toast.error(res.message);
            }
        }
    };

    const handleDeleteClick = (address: IAddress) => {
        setAddressToDelete(address);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!addressToDelete?.id) return;

        let res = await DeleteAddress(addressToDelete.id);
        if (res.isSuccess && Number(res.statusCode) === 200) {
            await fetchAddresses();
            toast.success(res.message);
            setIsDeleteDialogOpen(false);
            setAddressToDelete(null);
            // Clear selection if deleted address was selected
            if (selectedAddressId === addressToDelete.id) {
                setSelectedAddressId("");
            }
        } else {
            toast.error(res.message);
        }
    };

    const handleSetDefaultAddress = async (address: IAddress) => {
        if (!address.id || address.isDefault) return;
        setIsSettingDefault(address.id);
        try {
            const res = await SetAddressDefault(address.id);
            if (res.isSuccess && Number(res.statusCode) === 200) {
                toast.success(res.message || "Đã thiết lập địa chỉ mặc định");
                await fetchAddresses();
            } else {
                toast.error(res.message || "Không thể thiết lập địa chỉ mặc định");
            }
        } catch (error) {
            console.error("SetAddressDefault error:", error);
            toast.error("Không thể thiết lập địa chỉ mặc định");
        } finally {
            setIsSettingDefault(null);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchAddresses();
        }
    }, [user?.id]);

    // Reset form khi mở dialog thêm địa chỉ
    useEffect(() => {
        if (isAddAddressOpen) {
            fetchProvinces();
            setDistrictsForAdd([]);
            addressForm.reset({
                fullName: "",
                phoneNumber: "",
                provinceId: "",
                districtId: "",
                address: "",
                isDefault: false,
            });
        }
    }, [isAddAddressOpen]);

    // Load districts when province changes (Add)
    useEffect(() => {
        if (!isAddAddressOpen) return;
        if (addProvinceId) {
            addressForm.setValue("districtId", "");
            fetchDistricts(addProvinceId, "add");
        } else {
            setDistrictsForAdd([]);
        }
    }, [isAddAddressOpen, addProvinceId]);

    // When update dialog opens: fetch provinces
    useEffect(() => {
        if (!isUpdateAddressOpen) return;
        fetchProvinces();
    }, [isUpdateAddressOpen]);

    // Map existing province/district name -> ids when update dialog opens
    useEffect(() => {
        if (!isUpdateAddressOpen || !addressToUpdate || provinces.length === 0) return;

        const matchedProvince =
            provinces.find((p) => p.full_name === addressToUpdate.province) ||
            provinces.find((p) => p.name === addressToUpdate.province);

        if (matchedProvince) {
            updateAddressForm.setValue("provinceId", matchedProvince.id);
            updateAddressForm.setValue("districtId", "");
            fetchDistricts(matchedProvince.id, "update");
        }
    }, [isUpdateAddressOpen, addressToUpdate?.province, provinces.length]);

    useEffect(() => {
        if (!isUpdateAddressOpen || !addressToUpdate) return;
        if (updateProvinceId) {
            fetchDistricts(updateProvinceId, "update");
        }
    }, [isUpdateAddressOpen, updateProvinceId]);

    useEffect(() => {
        if (!isUpdateAddressOpen || !addressToUpdate) return;
        if (districtsForUpdate.length === 0) return;

        const matchedDistrict =
            districtsForUpdate.find((d) => d.full_name === addressToUpdate.district) ||
            districtsForUpdate.find((d) => d.name === addressToUpdate.district);

        if (matchedDistrict) {
            updateAddressForm.setValue("districtId", matchedDistrict.id);
        }
    }, [isUpdateAddressOpen, addressToUpdate?.district, districtsForUpdate.length]);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("vi-VN") + "₫";
    };

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
    );

    // Fetch vouchers when modal opens
    useEffect(() => {
        if (voucherDialogOpen) {
            fetchVouchers();
            setSelectedVoucherIdInModal(appliedVoucherId); // Set initial selection to currently applied voucher
        }
    }, [voucherDialogOpen]);

    const fetchVouchers = async () => {
        setLoadingVouchers(true);
        try {
            const res = await GetVouchers();
            if (res.isSuccess && Number(res.statusCode) === 200) {
                // Filter only active vouchers
                const activeVouchers = res?.data?.filter(
                    (voucher) => voucher.isActive &&
                        new Date(voucher.endDate) > new Date() &&
                        new Date(voucher.startDate) <= new Date()
                );
                setVouchers(activeVouchers);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách voucher");
        } finally {
            setLoadingVouchers(false);
        }
    };


    const handleApplyVoucher = async () => {
        if (user?.id && selectedVoucherIdInModal) {
            let res = await ValidateVoucher(user.id, selectedVoucherIdInModal);
            if (res.isSuccess && Number(res.statusCode) === 200) {
                if (res.data !== null && res.data !== undefined) {
                    setVoucherValidationInfo(res.data);
                    setAppliedVoucherId(selectedVoucherIdInModal);
                    setVoucherDialogOpen(false);
                    toast.success(res.message);
                }
            } else {
                toast.error(res.message || "Không thể áp dụng voucher");
            }
        }
    };

    const tax = subtotal * TAX_RATE;

    // Get selected voucher for display purposes only
    const selectedVoucher = vouchers?.find(v => v.id === appliedVoucherId) || null;

    // Use totalAmount from API validation result if voucher is applied, otherwise calculate from subtotal + tax
    const total = voucherValidationInfo?.totalAmount ?? (subtotal + tax);

    const handlePlaceOrder = async () => {
        if (!user?.id) {
            toast.error("Vui lòng đăng nhập để đặt hàng");
            return;
        }

        if (!selectedAddressId) {
            toast.error("Vui lòng chọn địa chỉ giao hàng");
            setConfirmOrderDialogOpen(false);
            return;
        }

        setIsPlacingOrder(true);
        try {
            if (paymentMethod === "QR") {
                // Prepare returnUrl for backend to create RETURN_URL with orderCode
                const returnUrl = typeof window !== "undefined" 
                    ? `${window.location.origin}/checkout/success?orderCode={orderCode}&paymentMethod=QR`
                    : undefined;
                
                let res = await CreateOrderWithQR(
                    user.id,
                    appliedVoucherId,
                    selectedAddressId,
                    note || null,
                    paymentMethod,
                    total,
                    returnUrl
                );
                if (res.isSuccess && Number(res.statusCode) === 201 && res.data) {
                    toast.success(res.message);
                    setConfirmOrderDialogOpen(false);
                    
                    // Fetch cart again to clear it after order creation
                    await fetchCart();
                    
                    // API returns IOrderInfo with checkoutUrl and orderCode
                    const orderInfo = res.data as IOrderInfo;
                    if (orderInfo.checkoutUrl) {
                        // Backend should have configured RETURN_URL as: 
                        // {returnUrl}/checkout/success?orderCode=${orderCode}&paymentMethod=QR
                        // Redirect to PayOS checkout URL
                        window.location.href = orderInfo.checkoutUrl;
                    } else {
                        toast.error("Không tìm thấy URL thanh toán");
                    }
                } else {
                    toast.error(res.message || "Không thể đặt hàng. Vui lòng thử lại");
                }
            }
            else if (paymentMethod === "COD") {
                let res = await CreateOrderWithCOD(
                    user.id,
                    appliedVoucherId,
                    selectedAddressId,
                    note || null,
                    paymentMethod,
                    total
                );
                if (res.isSuccess && Number(res.statusCode) === 201) {
                    toast.success(res.message)
                    setConfirmOrderDialogOpen(false);
                    fetchCart();
                    router.push(`/checkout/success?orderCode=${res.data}&paymentMethod=${paymentMethod}`)
                } else {
                    toast.error(res.message || "Không thể đặt hàng. Vui lòng thử lại");
                }
            }
        } catch (error) {
            console.error("Error placing order:", error);
            toast.error("Có lỗi xảy ra. Vui lòng thử lại");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handleOpenConfirmDialog = () => {
        if (!selectedAddressId) {
            toast.error("Vui lòng chọn địa chỉ giao hàng");
            return;
        }
        setConfirmOrderDialogOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#F7F7F8]">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Back to Cart */}
                <Link
                    href="/cart"
                    className="flex items-center gap-2 text-gray-700 hover:text-black mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại giỏ hàng
                </Link>

                <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Delivery & Payment Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Delivery Address */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Địa chỉ giao hàng
                                    </CardTitle>
                                    {addresses.length > 0 && (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setIsAddAddressOpen(true)}
                                        >
                                            ＋ Thêm địa chỉ
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {addresses.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <p className="mb-4">Bạn chưa có địa chỉ nào</p>
                                        <Button 
                                            variant="outline"
                                            onClick={() => setIsAddAddressOpen(true)}
                                        >
                                            Thêm địa chỉ
                                        </Button>
                                    </div>
                                ) : (
                                    <RadioGroup
                                        value={selectedAddressId}
                                        onValueChange={setSelectedAddressId}
                                        className="space-y-3"
                                    >
                                        {addresses.map((address) => {
                                            const isSelected = selectedAddressId === address.id;

                                            return (
                                                <div
                                                    key={address.id}
                                                    className={`group relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${isSelected
                                                        ? "border-purple-600 bg-purple-50/50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                        }`}
                                                >
                                                    <label className="flex-1 flex items-start gap-3 cursor-pointer">
                                                        <div className="mt-1">
                                                            <RadioGroupItem
                                                                value={address.id}
                                                                id={address.id}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            {/* Name and Phone */}
                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                <span className="font-semibold text-base">
                                                                    {address.fullName || "N/A"}
                                                                </span>
                                                                <span className="text-gray-400">|</span>
                                                                <span className="text-gray-600">
                                                                    {address.phoneNumber || "N/A"}
                                                                </span>
                                                                {address.isDefault && (
                                                                    <>
                                                                        <span className="text-gray-400">|</span>
                                                                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                                                                            Mặc định
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Full Address */}
                                                            <p className="text-sm text-gray-700 leading-relaxed mb-1">
                                                                {address.address}
                                                            </p>
                                                            
                                                            {/* District and Province */}
                                                            {(address.district || address.province) && (
                                                                <p className="text-sm text-gray-600">
                                                                    {[address.district, address.province].filter(Boolean).join(", ")}
                                                                </p>
                                                            )}

                                                            {/* Set Default Button */}
                                                            {!address.isDefault && (
                                                                <div className="mt-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 text-xs"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleSetDefaultAddress(address);
                                                                        }}
                                                                        disabled={isSettingDefault === address.id}
                                                                    >
                                                                        {isSettingDefault === address.id ? "Đang thiết lập..." : "Thiết lập mặc định"}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>
                                                    {/* Action Buttons */}
                                                    <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleUpdateClick(address);
                                                            }}
                                                            title="Cập nhật"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDeleteClick(address);
                                                            }}
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Phương thức thanh toán
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup
                                    value={paymentMethod}
                                    onValueChange={(value) =>
                                        setPaymentMethod(value as "QR" | "COD")
                                    }
                                    className="space-y-3"
                                >
                                    <label
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "QR"
                                            ? "border-black bg-gray-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <RadioGroupItem value="QR" id="QR" />
                                        <span className="font-semibold">
                                            Thanh toán với mã QR
                                        </span>
                                    </label>

                                    <label
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === "COD"
                                            ? "border-black bg-gray-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <RadioGroupItem value="COD" id="COD" />
                                        <span className="font-semibold">Thanh toán khi nhận hàng</span>
                                    </label>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                        {/* Order Note */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Ghi chú đơn hàng
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Ví dụ: Giao giờ nghỉ trưa, không ớt, gọi trước khi đến..."
                                        className="w-full min-h-[100px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:border-black"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Tóm tắt đơn hàng</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Order Items */}
                                <div className="space-y-3">
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between"
                                        >
                                            <span className="text-sm">
                                                {item.menuName} x {item.quantity}
                                            </span>
                                            <span className="font-semibold">
                                                {formatCurrency(item.unitPrice * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4">
                                    {/* Apply Voucher */}
                                    <div className="space-y-2">
                                        {!selectedVoucher ? (
                                            <Button
                                                variant="outline"
                                                onClick={() => setVoucherDialogOpen(true)}
                                                className="w-full border-dashed"
                                            >
                                                <Tag className="w-4 h-4 mr-2" />
                                                Voucher
                                            </Button>
                                        ) : (
                                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-green-700">
                                                        {selectedVoucher.code}
                                                    </div>
                                                    {selectedVoucher.discountType === "percent" ? (
                                                        <div className="text-xs text-green-600">
                                                            Giảm {selectedVoucher.discountValue}%
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-green-600">
                                                            Giảm {formatCurrency(selectedVoucher.discountValue)}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setAppliedVoucherId(null);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Tạm tính</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span>Thuế ({TAX_RATE * 100}%)</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                    {selectedVoucher && voucherValidationInfo && (
                                        <div className="flex items-center justify-between text-sm text-green-600">
                                            <span>Giảm giá</span>
                                            <span>-{formatCurrency(voucherValidationInfo.discountAmount)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-bold text-lg">Tổng cộng</span>
                                        {selectedVoucher && voucherValidationInfo ? (
                                            <span className="font-bold text-lg">
                                                {formatCurrency(voucherValidationInfo.totalAmount)}
                                            </span>
                                        ) : (
                                            <span className="font-bold text-lg">
                                                {formatCurrency(total)}
                                            </span>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleOpenConfirmDialog}
                                        className="w-full bg-black hover:bg-black/90 text-white h-12"
                                        disabled={!selectedAddressId}
                                    >
                                        Đặt hàng
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Voucher Dialog */}
            <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chọn Voucher</DialogTitle>
                        <div className="mt-1 text-xs text-gray-500">
                            Mỗi voucher chỉ được sử dụng 1 lần trong ngày
                        </div>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {loadingVouchers ? (
                            <div className="text-center py-8 text-gray-500">
                                Đang tải voucher...
                            </div>
                        ) : vouchers?.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Không có voucher khả dụng
                            </div>
                        ) : (
                            <RadioGroup
                                value={selectedVoucherIdInModal || ""}
                                onValueChange={(value) => {
                                    // Đảm bảo lưu đúng id của voucher dạng string
                                    setSelectedVoucherIdInModal(value || null);
                                }}
                                className="space-y-3"
                            >
                                {vouchers?.map((voucher) => {
                                    const isEligible = subtotal >= voucher.minOrderAmount;
                                    const isSelected = selectedVoucherIdInModal === voucher.id;

                                    return (
                                        <label
                                            key={voucher.id}
                                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                ? "border-green-500 bg-green-50"
                                                : isEligible
                                                    ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                    : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                                                }`}
                                        >
                                            <div className="mt-1">
                                                <RadioGroupItem
                                                    value={voucher.id}
                                                    id={voucher.id}
                                                    disabled={!isEligible}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Tag className="w-4 h-4 text-green-600" />
                                                    <span className="font-bold text-lg">
                                                        {voucher.code}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {voucher.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                                    <span>
                                                        Đơn tối thiểu:{" "}
                                                        {formatCurrency(voucher.minOrderAmount)}
                                                    </span>
                                                </div>

                                                {!isEligible && (
                                                    <div className="mt-2 text-xs text-red-600">
                                                        Cần thêm{" "}
                                                        {formatCurrency(
                                                            voucher.minOrderAmount - subtotal
                                                        )}{" "}
                                                        để sử dụng
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    );
                                })}
                            </RadioGroup>
                        )}
                    </div>
                    {!loadingVouchers && vouchers && vouchers.length > 0 && (
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setVoucherDialogOpen(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleApplyVoucher}
                                disabled={!selectedVoucherIdInModal}
                                className="bg-black hover:bg-black/90 text-white"
                            >
                                Áp dụng
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirm Order Dialog */}
            <Dialog open={confirmOrderDialogOpen} onOpenChange={setConfirmOrderDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Xác nhận đặt hàng</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn đặt hàng này không?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tổng tiền:</span>
                                <span className="font-semibold">
                                    {selectedVoucher && voucherValidationInfo
                                        ? formatCurrency(voucherValidationInfo.totalAmount)
                                        : formatCurrency(total)
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phương thức thanh toán:</span>
                                <span className="font-semibold">
                                    {paymentMethod === "QR" ? "Thanh toán QR" : "Thanh toán khi nhận hàng"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOrderDialogOpen(false)}
                            disabled={isPlacingOrder}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handlePlaceOrder}
                            disabled={isPlacingOrder}
                            className="bg-black hover:bg-black/90 text-white"
                        >
                            {isPlacingOrder ? "Đang xử lý..." : "Xác nhận đặt hàng"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Address Dialog */}
            <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thêm địa chỉ mới</DialogTitle>
                        <DialogDescription>
                            Nhập địa chỉ giao hàng của bạn. Bạn có thể thêm nhiều địa chỉ.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...addressForm}>
                        <form onSubmit={addressForm.handleSubmit(handleAddAddress)} className="space-y-4">
                            <FormField
                                control={addressForm.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Họ và tên</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nguyễn Văn A" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={addressForm.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số điện thoại</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0123456789" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={addressForm.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Địa chỉ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số nhà, tên đường..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    control={addressForm.control}
                                    name="provinceId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tỉnh / Thành phố</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={isProvincesLoading ? "Đang tải..." : "Chọn tỉnh/thành phố"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {provinces.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.full_name || p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={addressForm.control}
                                    name="districtId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quận / Huyện</FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={!addProvinceId || isDistrictsAddLoading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue
                                                            placeholder={
                                                                !addProvinceId
                                                                    ? "Chọn tỉnh trước"
                                                                    : isDistrictsAddLoading
                                                                        ? "Đang tải..."
                                                                        : "Chọn quận/huyện"
                                                            }
                                                        />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {districtsForAdd.map((d) => (
                                                        <SelectItem key={d.id} value={d.id}>
                                                            {d.full_name || d.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={addressForm.control}
                                name="isDefault"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                        </FormControl>
                                        <FormLabel className="!mt-0 text-sm font-normal">
                                            Đặt làm địa chỉ mặc định
                                        </FormLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddAddressOpen(false);
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button type="submit">Thêm địa chỉ</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Update Address Dialog */}
            <Dialog open={isUpdateAddressOpen} onOpenChange={setIsUpdateAddressOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cập nhật địa chỉ</DialogTitle>
                        <DialogDescription>
                            Chỉnh sửa địa chỉ giao hàng của bạn.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...updateAddressForm}>
                        <form onSubmit={updateAddressForm.handleSubmit(handleUpdateAddress)} className="space-y-4">
                            <FormField
                                control={updateAddressForm.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Họ và tên</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nguyễn Văn A" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={updateAddressForm.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số điện thoại</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0123456789" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={updateAddressForm.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Địa chỉ</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Số nhà, tên đường..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    control={updateAddressForm.control}
                                    name="provinceId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tỉnh / Thành phố</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={isProvincesLoading ? "Đang tải..." : "Chọn tỉnh/thành phố"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {provinces.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.full_name || p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={updateAddressForm.control}
                                    name="districtId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quận / Huyện</FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={!updateProvinceId || isDistrictsUpdateLoading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue
                                                            placeholder={
                                                                !updateProvinceId
                                                                    ? "Chọn tỉnh trước"
                                                                    : isDistrictsUpdateLoading
                                                                        ? "Đang tải..."
                                                                        : "Chọn quận/huyện"
                                                            }
                                                        />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {districtsForUpdate.map((d) => (
                                                        <SelectItem key={d.id} value={d.id}>
                                                            {d.full_name || d.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={updateAddressForm.control}
                                name="isDefault"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 space-y-0">
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                        </FormControl>
                                        <FormLabel className="!mt-0 text-sm font-normal">
                                            Đặt làm địa chỉ mặc định
                                        </FormLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsUpdateAddressOpen(false);
                                        setAddressToUpdate(null);
                                        updateAddressForm.reset();
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button type="submit">Cập nhật địa chỉ</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Address Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa địa chỉ</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
                            {addressToDelete && (
                                <span className="block mt-2 font-medium text-foreground">{addressToDelete.address}</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setAddressToDelete(null);
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Xác nhận xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

const CheckoutPageWrapper = () => {
    return (
        <ProtectedRoute>
            <CheckoutPage />
        </ProtectedRoute>
    );
};

export default CheckoutPageWrapper;

