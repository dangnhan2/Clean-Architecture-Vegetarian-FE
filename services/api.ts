import axios from './interceptor';

export const Login = (email : string, password : string) => {
   return axios.post<IBackendRes<IAuthResponse>>(`/api/Auth/login`, {email, password});
}

export const Register = (email: string, password : string, confirmPassword : string) => {
    return axios.post<IBackendRes<string>>(`/api/Auth/register`, {email, password, confirmPassword});
}

export const VerifyEmail = (email : string, otp : string) => {
    return axios.post<IBackendRes<string>>(`/api/Auth/email/verify`, {email, otp});
}

export const RefreshToken = () => {
    return axios.post<IBackendRes<IAuthResponse>>(`/api/Auth/refresh`);
}

export const Logout = () => {
    return axios.post<IBackendRes<null>>(`/api/Auth/logout`);
}

export const ChangePassword = (id : string | undefined, currentPassword : string, newPassword: string, confirmPassword : string) => {
    return axios.post(`/api/Auth/change-password`, {id, currentPassword, newPassword, confirmPassword});
}

export const ForgetPassword = (email : string) => {
    return axios.post<IBackendRes<null>>(`/api/Auth/forgot-password`, {email});
}

export const ResetPassword = (email : string, newPassword: string, confirmPassword : string) => {
    return axios.post<IBackendRes<null>>(`/api/Auth/reset-password`, {email, newPassword, confirmPassword});
}

export const GetAddresses = (id : string) => {
    return axios.get<IBackendRes<IAddress[]>>(`/api/Common/user/${id}/addresses`);
}

export const AddAddress = (userId : string, address : string, fullName : string, phoneNumber : string) => {
    return axios.post<IBackendRes<null>>(`/api/Common/address`, {userId, address, fullName, phoneNumber});
}

export const UpdateAddress = (id : string, userId : string, address : string, fullName : string, phoneNumber : string) => {
    return axios.put<IBackendRes<null>>(`/api/Common/address/${id}`, {userId, address, fullName, phoneNumber});
}

export const DeleteAddress = (id : string) => {
    return axios.delete<IBackendRes<null>>(`/api/Common/address/${id}`);
}

export const UpdateProfile = (id : string | undefined, fullName : string, phoneNumber : string, avatar : File | undefined) => {
    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("phoneNumber", phoneNumber);
    if (avatar) {
        formData.append("avatar", avatar);
    }
    return axios.put<IBackendRes<null>>(`/api/Common/user/account/${id}`, formData);
}

export const GetCategories = () => {
    return axios.get<IBackendRes<ICategory[]>>(`/api/Common/categories`);
}

export const AddCategory = (name : string) => {
    return axios.post<IBackendRes<null>>(`/api/Admin/category`, {name});
}

export const UpdateCategory = (id : string, name : string) => {
    return axios.put<IBackendRes<null>>(`/api/Admin/category/${id}`, {name});
}

export const DeleteCategory = (id : string) => {
    return axios.delete<IBackendRes<null>>(`/api/Admin/category/${id}`);
}

export const GetFoodItems = (query : string | undefined) => {
    return axios.get<IBackendRes<IModelPaginate<IFoodItem>>>(`/api/Common/menus?${query}`);
}

export const GetFeaturedFoodItems = () => {
    return axios.get<IBackendRes<IFoodItem[]>>(`/api/Common/menus/featured`);
}

export const GetRecommendedFoodItems = (id : string) => {
    return axios.get<IBackendRes<IFoodItem[]>>(`/api/Common/menus/${id}/related`);
}

export const GetFoodItemById = (id : string) => {
    return axios.get<IBackendRes<IFoodItem>>(`/api/Common/menu/${id}`);
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
    formData.append("description", description || "");
    formData.append("originalPrice", String(originalPrice));
    formData.append("discountPrice", String(discountPrice));
    formData.append("isAvailable", String(isAvailable));
    formData.append("isOnSale", String(isOnSale));
    formData.append("thumbnail", thumbnail);

    return axios.post<IBackendRes<IFoodItem>>(`/api/Admin/menu`, formData, {
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
    formData.append("description", description || "");
    formData.append("originalPrice", String(originalPrice));
    formData.append("discountPrice", String(discountPrice));
    formData.append("isAvailable", String(isAvailable));
    formData.append("isOnSale", String(isOnSale));
    if (thumbnail) {
        formData.append("thumbnail", thumbnail);
    }

    return axios.put<IBackendRes<IFoodItem>>(`/api/Admin/menu/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export const DeleteFoodItem = (id: string) => {
    return axios.delete<IBackendRes<null>>(`/api/Admin/menu/${id}`);
}

export const GetUserById = (id : string | undefined) => {
    return axios.get<IBackendRes<IUser>>(`/api/Common/user/${id}`);
}

export const GetCartByUser = (id :string) => {
    return axios.get<IBackendRes<ICart>>(`/api/Common/cart?id=${id}`);
}

export const AddToCart = (userId : string, cartItems : ICartItemRequest[]) => {
    return axios.post<IBackendRes<null>>(`/api/Common/cart`, {userId, cartItems});
}

export const GetVouchers = () => {
    return axios.get<IBackendRes<IVoucher[]>>(`/api/Common/user/vouchers`);
}

export const ValidateVoucher = (userId : string, voucherId : string) => {
    return axios.post<IBackendRes<IVoucherValidationInfo>>(`/api/Common/user/voucher/validation`, {userId, voucherId});
}

export const CreateOrderWithQR = (userId : string, voucherId : string | null | undefined, addressId : string, note : string | null | undefined, paymentMethod : string, totalAmount : number) => {
    return axios.post<IBackendRes<IOrderInfo>>(`/api/Common/order/qr`, {userId, voucherId, addressId, note, paymentMethod, totalAmount});
}

export const CreateOrderWithCOD = (userId : string, voucherId : string | null | undefined, addressId : string, note : string | null | undefined, paymentMethod : string, totalAmount : number) => {
    return axios.post<IBackendRes<Number>>(`/api/Common/order/cod`, {userId, voucherId, addressId, note, paymentMethod, totalAmount});
}

export const GetOrdersByUser = (userId : string, query : string) => {
    return axios.get<IBackendRes<IModelPaginate<IOrderHistory>>>(`/api/Common/user/${userId}/orders?${query}`)
}

export const GetRatingsByMenu = (menuId : string, query : string) => {
    return axios.get<IBackendRes<IModelPaginate<IRating>>>(`/api/Common/ratings/menu/${menuId}?${query}`);
}

export const RatingMenu = async (
    menuId: string,
    orderId: string,
    userId: string,
    stars: number,
    comment: string,
    images: File[]
) => {
    const formData = new FormData();
    formData.append("menuId", menuId);
    formData.append("orderId", orderId);
    formData.append("userId", userId);
    formData.append("stars", String(stars));
    formData.append("comment", comment);

    // append ảnh (nhiều ảnh)
    images.forEach((img) => {
        formData.append("images", img); 
    });

    return axios.post<IBackendRes<string>>(`/api/Common/rating`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};