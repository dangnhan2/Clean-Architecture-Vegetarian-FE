import axios from "axios";
import type { AxiosResponse } from "axios";

export const GetProvinces = (): Promise<AxiosResponse<IProvince>> => {
    return axios.get<IProvince>(`https://esgoo.net/api-tinhthanh-new/1/0.htm`);
}

export const GetDistricts = (provinceId : string): Promise<AxiosResponse<IDistrict>> => {
    return axios.get<IDistrict>(`https://esgoo.net/api-tinhthanh-new/2/${provinceId}.htm`);
}