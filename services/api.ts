import axios from './interceptor';

export const Login = (email : string, password : string) => {
   return axios.post<IBackendRes<IAuthResponse>>(`/api/auth/login`, {email, password});
}

export const LoginGoogle = () => {
   // Redirect to Google OAuth endpoint
   // Backend will handle OAuth flow and redirect to /auth/processing?token=...
   if (typeof window === "undefined") return;
   
   window.location.href = `${process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI}`;
}

export const Register = (email: string, userName : string, password : string, confirmPassword : string) => {
    return axios.post<IBackendRes<string>>(`/api/auth/register`, {email,userName, password, confirmPassword});
}

export const VerifyEmail = (email : string, otp : string) => {
    return axios.post<IBackendRes<string>>(`/api/auth/email/verify`, {email, otp});
}

export const ResendEmail = (userEmail : string) => {
    return axios.post<IBackendRes<string>>(`/api/auth/email/resend`, {userEmail});
}

export const RefreshToken = () => {
    return axios.post<IBackendRes<IAuthResponse>>(`/api/auth/refresh`);
}

export const Logout = () => {
    return axios.post<IBackendRes<null>>(`/api/auth/logout`);
}

export const ChangePassword = (id : string | undefined, currentPassword : string, newPassword: string, confirmPassword : string) => {
    return axios.post(`/api/Auth/change-password`, {id, currentPassword, newPassword, confirmPassword});
}

export const ForgetPassword = (email : string) => {
    return axios.post<IBackendRes<null>>(`/api/auth/password/forgot`, {email});
}

export const ResetPassword = (email : string, newPassword: string, confirmPassword : string) => {
    return axios.post<IBackendRes<null>>(`/api/auth/password/reset`, {email, newPassword, confirmPassword});
}

export const GetAddresses = (id : string) => {
    return axios.get<IBackendRes<IAddress[]>>(`/api/common/user/${id}/addresses`);
}

export const AddAddress = (
    userId : string,
    address : string,
    fullName : string,
    phoneNumber : string,
    province: string,
    district: string,
    isDefault: boolean
) => {
    return axios.post<IBackendRes<null>>(`/api/common/address`, {
        userId,
        address,
        fullName,
        phoneNumber,
        province,
        district,
        isDefault,
    });
}

export const UpdateAddress = (
    id : string,
    userId : string,
    address : string,
    fullName : string,
    phoneNumber : string,
    province: string,
    district: string,
    isDefault: boolean
) => {
    return axios.put<IBackendRes<null>>(`/api/common/address/${id}`, {
        userId,
        address,
        fullName,
        phoneNumber,
        province,
        district,
        isDefault,
    });
}

export const DeleteAddress = (id : string) => {
    return axios.delete<IBackendRes<null>>(`/api/common/address/${id}`);
}

export const SetAddressDefault = (id : string) => {
    return axios.put<IBackendRes<null>>(`/api/common/address/default/${id}`);
}

export const UpdateProfile = (id : string | undefined, phoneNumber : string, avatar : File | undefined) => {
    const formData = new FormData();
    formData.append("phoneNumber", phoneNumber);
    if (avatar) {
        formData.append("avatar", avatar);
    }
    return axios.put<IBackendRes<null>>(`/api/common/user/profile/${id}`, formData);
}

export const GetCategories = () => {
    return axios.get<IBackendRes<ICategory[]>>(`/api/Common/categories`);
}

export const GetCategoriesByAdmin = () => {
    return axios.get<IBackendRes<ICategory[]>>(`/api/admin/categories`);
}

export const AddCategory = (name : string) => {
    return axios.post<IBackendRes<null>>(`/api/admin/category`, {name});
}

export const UpdateCategory = (id : string, name : string) => {
    return axios.put<IBackendRes<null>>(`/api/admin/category/${id}`, {name});
}

export const DeleteCategory = (id : string) => {
    return axios.delete<IBackendRes<null>>(`/api/admin/category/${id}`);
}

export const GetFoodItemsByAdmin = (query : string | undefined) => {
    return axios.get<IBackendRes<IModelPaginate<IFoodItem>>>(`/api/admin/menus?${query}`);
}
export const GetFoodItems = (query : string | undefined) => {
    return axios.get<IBackendRes<IModelPaginate<IFoodItem>>>(`/api/common/menus?${query}`);
}

export const GetFeaturedFoodItems = () => {
    return axios.get<IBackendRes<IFoodItem[]>>(`/api/common/menus/featured`);
}

export const GetRecommendedFoodItems = (id : string) => {
    return axios.get<IBackendRes<IFoodItem[]>>(`/api/common/menus/${id}/related`);
}

export const GetFoodItemById = (id : string) => {
    return axios.get<IBackendRes<IFoodItem>>(`/api/common/menu/${id}`);
}

export const CreateFoodItem = (
    name: string,
    categoryId: string,
    description: string | null | undefined,
    originalPrice: number,
    discountPrice: number,
    isAvailable: boolean,
    isOnSale: boolean,
    thumbnail: File
) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("categoryId", categoryId);
    if (description !== null && description !== undefined) {
        formData.append("description", description);
    }
    formData.append("originalPrice", String(originalPrice));
    formData.append("discountPrice", String(discountPrice));
    formData.append("isAvailable", String(isAvailable));
    formData.append("isOnSale", String(isOnSale));
    formData.append("thumbnail", thumbnail);

    return axios.post<IBackendRes<IFoodItem>>(`/api/admin/menu`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export const EditFoodItem = (
    id: string,
    name: string,
    categoryId: string,
    description: string | null | undefined,
    originalPrice: number,
    discountPrice: number,
    isAvailable: boolean,
    isOnSale: boolean,
    thumbnail: File | null | undefined
) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("categoryId", categoryId);
    if (description !== null && description !== undefined) {
        formData.append("description", description);
    }
    formData.append("originalPrice", String(originalPrice));
    formData.append("discountPrice", String(discountPrice));
    formData.append("isAvailable", String(isAvailable));
    formData.append("isOnSale", String(isOnSale));
    if (thumbnail) {
        formData.append("thumbnail", thumbnail);
    }

    return axios.put<IBackendRes<IFoodItem>>(`/api/admin/menu/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export const DeleteFoodItem = (id: string) => {
    return axios.delete<IBackendRes<null>>(`/api/admin/menu/${id}`);
}

export const GetUserById = (id : string | undefined) => {
    return axios.get<IBackendRes<IUser>>(`/api/common/user/${id}`);
}

export const GetCartByUser = (id :string) => {
    return axios.get<IBackendRes<ICart>>(`/api/common/cart?id=${id}`);
}

export const AddToCart = (userId : string, cartItems : ICartItemRequest[]) => {
    return axios.post<IBackendRes<null>>(`/api/common/cart`, {userId, cartItems});
}

export const GetVouchers = () => {
    return axios.get<IBackendRes<IVoucher[]>>(`/api/common/user/vouchers`);
}

export const GetVouchersAdmin = (query : string) => {
    return axios.get<IBackendRes<IModelPaginate<IVoucher>>>(`/api/admin/vouchers?${query}`);
}

export const ConfirmOrder = (orderId : string) => {
    return axios.post<IBackendRes<string>>(`/api/admin/order/${orderId}/confirm`);
}

export const CreateVoucher = (code : string,  discountType : string, discountValue : number, maxDiscount : number, minOrderAmount : number, startDate : string, endDate : string, usageLimit : number, perUserLimit : number, isActive : boolean) => {
    return axios.post<IBackendRes<IVoucher>>(`/api/admin/voucher`, {code, discountType, discountValue, maxDiscount, minOrderAmount, startDate, endDate, usageLimit, perUserLimit, isActive});
}

export const CancelOrder = (orderId : string, userId : string, reason : string, paymentMethod : number, bankBin :string, bankAccountNumber :string) => {
    return axios.post<IBackendRes<string>>(`/api/common/order/${orderId}/cancel`, {userId, reason, paymentMethod, bankBin, bankAccountNumber});
}

export const EditVoucher = (id : string, code : string,  discountType : string, discountValue : number, maxDiscount : number, minOrderAmount : number, startDate : string, endDate : string, usageLimit : number, perUserLimit : number, isActive : boolean) => {
    return axios.put<IBackendRes<IVoucher>>(`/api/admin/voucher/${id}`, {code, discountType, discountValue, maxDiscount, minOrderAmount, startDate, endDate, usageLimit, perUserLimit, isActive});
}

export const DeleteVoucher = (id : string) => {
    return axios.delete<IBackendRes<null>>(`/api/admin/voucher/${id}`);
}

export const ValidateVoucher = (userId : string, voucherId : string) => {
    return axios.post<IBackendRes<IVoucherValidationInfo>>(`/api/common/user/voucher/validation`, {userId, voucherId});
}

export const CreateOrderWithQR = (userId : string, voucherId : string | null | undefined, addressId : string, note : string | null | undefined, paymentMethod : number, totalAmount : number, returnUrl? : string) => {
    const payload: any = {userId, voucherId, addressId, note, paymentMethod, totalAmount};
    if (returnUrl) {
        payload.returnUrl = returnUrl;
    }
    return axios.post<IBackendRes<IOrderInfo>>(`/api/common/order/qr`, payload);
}

export const CreateOrderWithCOD = (userId : string, voucherId : string | null | undefined, addressId : string, note : string | null | undefined, paymentMethod : number, totalAmount : number) => {
    return axios.post<IBackendRes<Number>>(`/api/common/order/cod`, {userId, voucherId, addressId, note, paymentMethod, totalAmount});
}

export const GetOrdersByUser = (userId : string, query : string) => {
    return axios.get<IBackendRes<IModelPaginate<IOrderHistory>>>(`/api/common/user/${userId}/orders?${query}`)
}

export const GetRatingsByMenu = (menuId : string, query : string) => {
    return axios.get<IBackendRes<IModelPaginate<IRating>>>(`/api/common/ratings/menu/${menuId}?${query}`);
}

export const RatingMenu = async (
    menuId: string,
    orderId: string,
    userId: string,
    userName: string,
    stars: number,
    comment: string,
    images: File[]
) => {
    const formData = new FormData();
    formData.append("menuId", menuId);
    formData.append("orderId", orderId);
    formData.append("userId", userId);
    formData.append("userName", userName);
    formData.append("stars", String(stars));
    formData.append("comment", comment);

    // append ảnh (nhiều ảnh)
    images.forEach((img) => {
        formData.append("images", img); 
    });

    return axios.post<IBackendRes<string>>(`/api/common/rating`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const GetUsers = (query : string) => {
    return axios.get<IBackendRes<IModelPaginate<IUser>>>(`/api/admin/users?${query}`);
}

export const BanUser = (id : string) => {
    return axios.put<IBackendRes<null>>(`/api/admin/user_banning/${id}`);
}

export const UnbanUser = (id : string) => {
    return axios.put<IBackendRes<null>>(`/api/admin/user_unbanning/${id}`);
}

export const GetOrdersAdmin = (query : string) => {
    return axios.get<IBackendRes<IModelPaginate<IOrderHistory>>>(`/api/admin/orders?${query}`);
}

export const GetDashboard = () => {
    return axios.get<IBackendRes<IDashboard>>(`/api/admin/dashboard`);
}

export const GetNotificationByAdmin = (adminId: string) => {
    return axios.get<IBackendRes<INotification[]>>(`/api/admin/notifications?id=${adminId}`)
}

export const GetUnreadNotificationCount = (adminId: string) => {
    return axios.get<IBackendRes<IUnreadNotification>>(`/api/admin/notification/unread?id=${adminId}`)
}

export const DeleteNotification = (id : string) => {
    return axios.delete<IBackendRes<null>>(`/api/admin/notification?id=${id}`)
}

export const MarkNotificationAsRead = (notificationIds: string[]) => {
    return axios.put<IBackendRes<null>>(`/api/admin/notifications/marking`, { notificationIds })
}

export const SearchMenu = (keyword : string) => {
    return axios.get<IBackendRes<ISearchMenuResponse[]>>(`/api/common/searching?keyword=${keyword}`);
}

export const GetAdvertisementsByAdmin = () => {
    return axios.get<IBackendRes<IAdvertisement[]>>(`/api/admin/advertisements`);
}

export const GetAdvertisements = () => {
    return axios.get<IBackendRes<IAdvertisement[]>>(`/api/common/advertisements`);
}

export const AddAdvertisement = (
    title: string,
    bannerUrl: File,
    adTargetType: string,
    targetKey: string | null | undefined,
    startAt: string | null | undefined,
    endAt: string | null | undefined,
    isActive: boolean
) => {
    const formData = new FormData();
    formData.append("Title", title);
    formData.append("BannerUrl", bannerUrl);
    formData.append("AdTargetType", adTargetType);
    if (targetKey) {
        formData.append("TargetKey", targetKey);
    }
    if (startAt) {
        formData.append("StartAt", startAt);
    }
    if (endAt) {
        formData.append("EndAt", endAt);
    }
    formData.append("IsActive", String(isActive));

    return axios.post<IBackendRes<string>>(`/api/admin/advertisement`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export const UpdateAdvertisement = (
    id: string,
    title: string,
    bannerUrl: File | null | undefined,
    adTargetType: string,
    targetKey: string | null | undefined,
    startAt: string | null | undefined,
    endAt: string | null | undefined,
    isActive: boolean
) => {
    const formData = new FormData();
    formData.append("Title", title);
    if (bannerUrl) {
        formData.append("BannerUrl", bannerUrl);
    }
    formData.append("AdTargetType", adTargetType);
    if (targetKey) {
        formData.append("TargetKey", targetKey);
    }
    if (startAt) {
        formData.append("StartAt", startAt);
    }
    if (endAt) {
        formData.append("EndAt", endAt);
    }
    formData.append("IsActive", String(isActive));

    return axios.put<IBackendRes<string>>(`/api/admin/advertisement/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}


export const ResponseRating = (userId : string, ratingId : string, comment : string) => {
    return axios.post<IBackendRes<null>>(`/api/admin/rating/responsing`, {userId, ratingId, comment});
}

export const GetMenusOnSale = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IFoodItem>>>(`/api/common/menus/onsale?${query}`);
}