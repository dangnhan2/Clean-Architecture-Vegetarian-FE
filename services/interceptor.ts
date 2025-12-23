import axios from "axios";
import { RefreshToken } from "./api";

const instance = axios.create({
  baseURL: "https://localhost:8081",
  withCredentials: true, // ⚠️ để gửi refresh token qua cookie
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// 🟢 REQUEST interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔴 RESPONSE interceptor
instance.interceptors.response.use(
  (response) => {
    if (response.data) return response.data;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ⚠️ Nếu gặp 401 (token hết hạn) và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh → chờ refresh xong rồi retry
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Refreshing access token...");

        // 🧩 Gọi API refresh token
        const res = await RefreshToken();

        if (res.isSuccess === false) throw new Error("Failed to refresh token");
        
        const newToken = res.data?.accessToken
        if (newToken)
        // ✅ Lưu lại token mới
        localStorage.setItem("access_token", newToken);

        // ✅ Retry request ban đầu
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        return instance(originalRequest);
      } catch (err) {
        console.error("Refresh token failed:", err);
        processQueue(err, null);
        localStorage.removeItem("access_token");
        // 👉 (Tuỳ chọn) redirect về trang login
        window.location.href = "/auth/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Các lỗi khác
    if (error.response?.data) return error.response.data;
    return Promise.reject(error);
  }
);

export default instance;
