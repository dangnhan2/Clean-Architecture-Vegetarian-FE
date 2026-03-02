"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/context";
import UserAvatar from "@/components/UserAvatar";
import { Trash2, MapPin, Edit2, Phone, User } from "lucide-react";
import { ChangePassword, DeleteAddress, GetAddresses, UpdateProfile, AddAddress, UpdateAddress, SetAddressDefault } from "@/services/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { GetProvinces, GetDistricts } from "@/services/external_api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TABS = ["Thông tin cá nhân", "Địa chỉ", "Bảo mật"] as const;
type TabKey = typeof TABS[number];

const ProfilePage = () => {
  const { user, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("Thông tin cá nhân");
  const [addresses, setAddresses] = useState<IAddress[] | null | undefined>();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.imageUrl);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<IAddress | null>(null);
  const [isUpdateAddressOpen, setIsUpdateAddressOpen] = useState(false);
  const [addressToUpdate, setAddressToUpdate] = useState<IAddress | null>(null);
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const storageKey = "profileActiveTab";

  // Schema đổi mật khẩu
  const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(6, "Tối thiểu 6 ký tự"),
      newPassword: z.string().min(6, "Tối thiểu 6 ký tự"),
      confirmPassword: z.string().min(6, "Tối thiểu 6 ký tự"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Mật khẩu xác nhận không khớp",
      path: ["confirmPassword"],
    });

  type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
  type ProfileValues = z.infer<typeof profileSchema>;

  // Schema thêm / sửa địa chỉ theo request body mới
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

  const [provinces, setProvinces] = useState<IProvinceData[]>([]);
  const [isProvincesLoading, setIsProvincesLoading] = useState(false);
  const [districtsForAdd, setDistrictsForAdd] = useState<IDistrictData[]>([]);
  const [districtsForUpdate, setDistrictsForUpdate] = useState<IDistrictData[]>([]);
  const [isDistrictsAddLoading, setIsDistrictsAddLoading] = useState(false);
  const [isDistrictsUpdateLoading, setIsDistrictsUpdateLoading] = useState(false);

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

  const changePasswordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Schema cập nhật thông tin cá nhân
  const profileSchema = z.object({
    userName: z.string().min(1, "Tên người dùng không được để trống"),
    email: z.string().email("Email không hợp lệ"),
    phoneNumber: z.string().min(10, "Vui lòng nhập số điện thoại"),
    avatar: z.instanceof(File).optional(),
  });
 
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      userName: user?.userName ?? "",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      avatar: undefined,
    },
  });

  const fetchAddress = async () => {
    let userId = user?.id;
    if (userId) {
      let res = await GetAddresses(userId);
      if (res.isSuccess && Number(res.statusCode) === 200) {
        setAddresses(res?.data);
      }
    }
  };

  const handleDeleteClick = (address: IAddress) => {
    setAddressToDelete(address);
    setIsDeleteDialogOpen(true);
  };

  const handleSetDefaultAddress = async (address: IAddress) => {
    if (!address.id || address.isDefault) return;
    setIsSettingDefault(address.id);
    try {
      const res = await SetAddressDefault(address.id);
      if (res.isSuccess && Number(res.statusCode) === 200) {
        toast.success(res.message || "Đã thiết lập địa chỉ mặc định");
        await fetchAddress();
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

  const handleDeleteConfirm = async () => {
    if (!addressToDelete?.id) return;
    
    let res = await DeleteAddress(addressToDelete.id);
    if (res.isSuccess && Number(res.statusCode) === 200) {
      fetchAddress();
      toast.success(res.message);
      setIsDeleteDialogOpen(false);
      setAddressToDelete(null);
    } else {
      toast.error(res.message);
    }
  };

  const handleAddAddress = async (values: AddressValues) => {
    if (user?.id){
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
        await fetchAddress();
        setIsAddAddressOpen(false);
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
        fetchAddress();
        setIsUpdateAddressOpen(false);
        setAddressToUpdate(null);
        updateAddressForm.reset();
      } else {
        toast.error(res.message);
      }
    }  
  };

  const onSubmit = async (values: ChangePasswordValues) => {
    let res = await ChangePassword(user?.id, values.currentPassword, values.newPassword, values.confirmPassword);

    if (res?.isSuccess && Number(res.statusCode) === 201) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleUpdateProfile = async (values: ProfileValues) => {
    setIsUpdatingProfile(true);
    try {
      let res = await UpdateProfile(user?.id, values.phoneNumber, values.avatar);
      if (res.isSuccess && Number(res.statusCode) === 200) {
        toast.success(res.message);
        refresh();
        // Reset avatar field sau khi submit thành công và quay về ảnh gốc
        profileForm.setValue("avatar", undefined);
        setAvatarPreview(user?.imageUrl);
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

   // Đồng bộ lại giá trị form khi user thay đổi (sau khi load async)
   useEffect(() => {
    if (user) {
      profileForm.reset({
        userName: user?.userName ?? "",
        email: user?.email ?? "",
        phoneNumber: user?.phoneNumber ?? "",
        avatar: undefined,
      });
      setAvatarPreview(user?.imageUrl);
    }
  }, [user]);

  // Load tab lưu localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && (TABS as readonly string[]).includes(saved)) {
        setActiveTab(saved as TabKey);
      }
    } catch { }
  }, []);

  // Save tab
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, activeTab);
    } catch { }
  }, [activeTab]);

  useEffect(() => {
    if (user?.id) {
      fetchAddress()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // When update dialog opens: fetch provinces and map existing province/district name -> ids
  useEffect(() => {
    if (!isUpdateAddressOpen) return;
    fetchProvinces();
  }, [isUpdateAddressOpen]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdateAddressOpen, addressToUpdate?.province, provinces.length]);

  useEffect(() => {
    if (!isUpdateAddressOpen || !addressToUpdate) return;
    if (updateProvinceId) {
      // if user manually changes province, reload districts
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdateAddressOpen, addressToUpdate?.district, districtsForUpdate.length]);

  // Cleanup preview URL khi component unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">Hồ sơ của tôi</h2>

      {/* Tabs */}
      <div className="mb-6">
        <div className="grid grid-cols-3 rounded-xl border bg-muted/30 p-1 text-sm">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors ${isActive ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab === "Thông tin cá nhân" && "👤"}
                {tab === "Địa chỉ" && "📍"}
                {tab === "Bảo mật" && "🔒"}
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {/* THÔNG TIN CÁ NHÂN */}
        {activeTab === "Thông tin cá nhân" && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Thông tin cá nhân</h3>
            <p className="text-sm text-muted-foreground">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>

            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Left: inputs (Form) */}
                <div className="sm:col-span-2 space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên người dùng</FormLabel>
                        <FormControl>
                          <Input placeholder="Tên người dùng" {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="name@example.com" {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right: avatar */}
                <div className="sm:col-span-1">
                  <FormField
                    control={profileForm.control}
                    name="avatar"
                    render={({ field: { onChange } }) => (
                      <FormItem>
                        <FormLabel>Ảnh đại diện</FormLabel>
                        <FormControl>
                          <div className="flex flex-col items-center gap-4 rounded-lg border p-4">
                            {/* Avatar preview */}
                            <div className="relative h-24 w-24 rounded-full bg-muted grid place-items-center overflow-hidden">
                              {avatarPreview ? (
                                <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                              ) : (
                                <UserAvatar avatar={user?.imageUrl} />
                              )}
                            </div>

                            {/* File button */}
                            <Button
                              type="button"
                              className="w-full"
                              onClick={() => document.getElementById("avatarUpload")?.click()}
                            >
                              Chọn ảnh
                            </Button>

                            {/* Hidden file input */}
                            <input
                              id="avatarUpload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onChange(file); // update form value

                                  // Cleanup preview cũ
                                  if (avatarPreview && avatarPreview.startsWith("blob:")) {
                                    URL.revokeObjectURL(avatarPreview);
                                  }
                                  const previewUrl = URL.createObjectURL(file);
                                  setAvatarPreview(previewUrl);
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

                {/* Bottom submit button spans grid */}
                <div className="sm:col-span-3">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? "Đang cập nhật..." : "Cập nhật thông tin"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* ĐỊA CHỈ */}
        {activeTab === "Địa chỉ" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium">Địa chỉ đã lưu</h3>
                <p className="text-sm text-muted-foreground">Quản lí địa chỉ giao hàng</p>
              </div>
              <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
                <DialogTrigger asChild>
                  <Button>＋ Thêm địa chỉ</Button>
                </DialogTrigger>
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
            </div>

            <div className="space-y-4">
              {Array.isArray(addresses) && addresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
                  <div className="mb-4 grid h-16 w-16 place-items-center rounded-full border-2 border-dashed bg-background">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="mb-2 text-lg font-semibold">Bạn chưa có địa chỉ nào</h4>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Thêm địa chỉ giao hàng đầu tiên để đặt hàng nhanh hơn và thuận tiện hơn.
                  </p>
                </div>
              ) : (
                addresses?.map((a) => (
                  <Card key={a.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MapPin className="h-5 w-5" />
                        </div>

                        {/* Address Info */}
                        <div className="flex-1 space-y-3">
                          {/* Full Name and Phone */}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            {a.fullName && (
                              <div className="flex items-center gap-2 text-foreground">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{a.fullName}</span>
                              </div>
                            )}
                            {a.phoneNumber && (
                              <div className="flex items-center gap-2 text-foreground">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{a.phoneNumber}</span>
                              </div>
                            )}
                          </div>

                        {/* Address */}
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Địa chỉ</p>
                            <p className="text-base font-medium leading-relaxed text-foreground">
                              {a.address}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {a.district}, {a.province}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {a.isDefault && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              Địa chỉ mặc định
                            </span>
                          )}
                          {!a.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleSetDefaultAddress(a)}
                              disabled={isSettingDefault === a.id}
                            >
                              {isSettingDefault === a.id ? "Đang thiết lập..." : "Thiết lập mặc định"}
                            </Button>
                          )}
                        </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() => handleUpdateClick(a)}
                            title="Cập nhật"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(a)}
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Dialog cập nhật địa chỉ */}
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

            {/* Dialog xác nhận xóa địa chỉ */}
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
        )}

        {/* BẢO MẬT */}
        {activeTab === "Bảo mật" && (
          <div className="space-y-6 max-w-sm">
            <h3 className="text-lg font-medium">Đổi mật khẩu</h3>

            <Form {...changePasswordForm}>
              <form onSubmit={changePasswordForm.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={changePasswordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu hiện tại</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={changePasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={changePasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">Đổi mật khẩu</Button>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfilePageWrapper = () => {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
};

export default ProfilePageWrapper;
