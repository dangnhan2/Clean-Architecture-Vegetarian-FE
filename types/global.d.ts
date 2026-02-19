export { };

declare global {
    interface IBackendRes<T> {
        message: string;
        isSuccess: boolean;
        statusCode: number | string;
        data?: T;
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
        userName: string
        id: string | undefined
        imageUrl: string
        phoneNumber: string | null
        isActive : boolean
        totalAmountInMonth : number
        totalAmountInYear : number
        role: string | null
    }

    interface IAddress {
        id: string
        address: string
        fullName: string
        phoneNumber: string
        province: string
        district: string
        isDefault: boolean
    }

    interface ICategory {
        id: string
        name: string
    }

    type JsonElement = string | number | boolean | null | JsonElement[] | { [key: string]: JsonElement };

    interface IFoodItem {
        id: string
        name: string
        category: string
        description: string | JsonElement
        originalPrice: number
        discountPrice: number
        averageRating: number
        ratingCount : number
        imageUrl: string
        soldQuantity: number
        isAvailable: boolean
        isOnSale : boolean
        createdAt: string
        discountPercent : number
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
        checkoutUrl : string
        orderCode : number
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
        address : string,
        city : string,
        note : string
        orderStatus : number
        totalAmount : number
        orderCode : number
        paymentMethod : string
        menus : IItemHistory[] 
    }

    interface IItemHistory{
        id : string
        menuId : string
        menuName : string
        menuImage : string
        quantity : number
        unitPrice : number
        subPrice : number
        isRated : boolean
    }

    interface IRating {
        id : string
        menuId : string
        customerUserName : string
        stars : number
        comment : string
        ratingAt : string
        images : string[]
        responseComment? : string | null,
        responseAt? : string | null
        adminUserName? : string | null
    }

    interface IDashboard {
        totalOrdersToday: number
        paidOrdersToday: number
        cancelledOrdersToday: number
        revenueToday: number
        totalPaidOrdersMontly: number
        revenueMonthly: number
        totalCustomers: number
        totalMenuItems: number
        topSellingMenus: ITopSellingMenu[]
        topBuyers?: ITopBuyer[]
    }

    interface ITopSellingMenu {
        name: string
        imageUrl: string
        soldQuantity: number
    }

    interface ITopBuyer {
        id: string
        fullName: string
        email: string
        phoneNumber: string
        totalAmountInAMonth: number
    }

    interface INotification {
        id : string
        title : string
        message : string
        type : string
        data : string
        isRead : boolean
        createdAt : string
    }

    interface IUnreadNotification{
        total : number,
        unreadNotifications : INotification[]

    }

    interface ISearchMenuResponse {
        id : string
        name : string
        price: number
        imageUrl: string
    }

    interface IAdvertisement{
        id : string
        title : string
        bannerUrl : string
        adTargetType : string
        targetKey : string
        isActive : boolean
        startAt : string
        endAt : string
    }

    interface IProvince {
        error : number,
        error_text : string,
        data_name : string,
        data : IProvinceData[]
    }

    interface IProvinceData {
      id : string,
      code : string,
      name : string,
      name_en : string,
      full_name : string,
      full_name_en : string,
      latitude : string,
      longitude : string
    }

    interface IDistrict {
        error : number,
        error_text : string,
        data_id : string,
        data_code : string,
        data_name : string,
        data : IDistrictData[] 
    }

    interface IDistrictData {
        id: string,
        code : string,
        name : string,
        name_en : string,
       full_name : string,
      full_name_en : string,
      latitude : string,
      longitude : string
    }
        
}



