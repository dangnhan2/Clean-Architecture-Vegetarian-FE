export { };

declare global {
    interface IBackendRes<T> {
        message: string;
        isSuccess: boolean;
        statusCode: number | string;
        data?: T | null | undefined;
    }

    interface IModelPaginate<T> {
        page: number;
        pageSize: number;
        total: number;
        data: T[] | null | undefined;
    }

    interface IAuthResponse {
        accessToken: string
        data: IUser
    }

    interface IUser {
        email: string
        fullName: string
        id: string | undefined
        imageUrl: string
        phoneNumber: string | null
        role: string | null
    }

    interface IAddress {
        id: string
        address: string
        fullName?: string
        phoneNumber?: string
    }

    interface ICategory {
        id: string
        name: string
    }

    interface IFoodItem {
        id: string
        name: string
        category: string
        description: string
        originalPrice: number
        discountPrice: number
        averageRating: number
        ratingCount : number
        imageUrl: string
        soldQuantity: number
        isAvailable: boolean
        isOnSale : boolean
        createdAt: string
    }

    interface ICart{
        id : string
        userId : string
        items : ICartItem[]
    }
    
    interface ICartItem {
        id : string
        menuId : string
        menuName : string
        imageUrl : string
        quantity : number
        unitPrice : number
    }

    interface ICartItemRequest{
        menuId : string
        quantity : number
        unitPrice : number
    }

    interface IVoucher {
        id : string
        code : string
        description : string
        discountType : string
        discountValue : number
        maxDiscount : number
        minOrderAmount : number
        startDate : string
        endDate : string
        usageLimit : number
        usedCount : number
        perUserLimit : number
        isActive : boolean
    }

    interface IOrderInfo {
        orderCode : string
        checkoutUrl : string
        qrCode : string
        amount : number
    }

    interface IVoucherValidationInfo{
        discountAmount : number
        totalAmount :number
    }

    interface IOrderHistory{
        id : string
        userId : string
        orderDate : string
        fullName : string
        phoneNumber : string
        address : string
        orderStatus : number
        totalAmount : number
        transactionCode : number
        menus : IItemHistory[] 
    }

    interface IItemHistory{
        id : string
        menuId : string
        menuName : string
        menuImage : string
        quantity : number
        subPrice : number
    }
}



