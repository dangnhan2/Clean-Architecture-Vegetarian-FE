import axios from "axios";
import type { AxiosResponse } from "axios";

export const GetProvinces = (): Promise<AxiosResponse<IProvince>> => {
    return axios.get<IProvince>(`${process.env.NEXT_PUBLIC_PROVINCE_URI}`);
}

export const GetDistricts = (provinceId : string): Promise<AxiosResponse<IDistrict>> => {
    return axios.get<IDistrict>(`${process.env.NEXT_PUBLIC_DISTRICT_URI}/${provinceId}.htm`);
}

// API trả về dạng: { code: string; desc: string; data: IBankData[] }
// Không ép kiểu chặt chẽ ở đây để linh hoạt, nơi sử dụng sẽ cast về IBank
export const GetBanks = () => {
    return axios.get(`${process.env.NEXT_PUBLIC_BANK_URI}`);
}