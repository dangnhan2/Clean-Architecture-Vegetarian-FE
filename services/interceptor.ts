import axios from "axios";

const instance = axios.create({
  baseURL: "https://localhost:8081",
  withCredentials: true,
});

export const refreshClient = axios.create({
  baseURL: "https://localhost:8081",
  withCredentials: true,
});

// Gắn Bearer token cho các request refresh token (nếu có)
refreshClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token && config.headers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Client chỉ dùng cookie, không thêm Bearer token (dùng cho refresh token sau Google login)
export const cookieOnlyClient = axios.create({
  baseURL: "https://localhost:8081",
  withCredentials: true,
});

cookieOnlyClient.interceptors.response.use(
  (response) => {
    if (response.data) return response.data;
    return response;
  },
  (error) => {
    // Xử lý lỗi tương tự như instance
    if (error.response?.data) {
      if (error.response.data.isSuccess !== undefined) {
        return error.response.data;
      }
      return {
        isSuccess: false,
        statusCode: error.response.status || 500,
        message: error.response.data.message || error.response.data || "Có lỗi xảy ra",
        data: error.response.data.data || null,
      };
    }
    return Promise.reject({
      isSuccess: false,
      statusCode: error.response?.status || 500,
      message: error.message || "Có lỗi xảy ra",
      data: null,
    });
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

instance.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token && config.headers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => {
    if (response.data) return response.data;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isLoginRequest = originalRequest.url?.includes("/api/auth/login");
    const isRefreshRequest = originalRequest.url?.includes("/api/auth/refresh");

    // Không trigger refresh lại cho chính request refresh token hoặc login
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest && !isRefreshRequest) {
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

        // Gọi thẳng refreshClient, không dùng instance để tránh interceptor & Bearer
        const refreshRes = await refreshClient.post(`/api/auth/refresh`);
        const res = refreshRes.data as IBackendRes<IAuthResponse>;

        if (!res || res.isSuccess === false) throw new Error("Failed to refresh token");
        
        const newToken = res.data?.accessToken
        if (newToken) {
          localStorage.setItem("access_token", newToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        return instance(originalRequest);
      } catch (err) {
        console.error("Refresh token failed:", err);
        processQueue(err, null);
        localStorage.removeItem("access_token");
        // 👉 Redirect về trang login khi refresh token thất bại
        window.location.href = "/auth/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Các lỗi khác - trả về response data nếu có
    // Đảm bảo trả về đúng format IBackendRes
    if (error.response?.data) {
      // Nếu data đã có format đúng (isSuccess, statusCode, message)
      if (error.response.data.isSuccess !== undefined) {
        return error.response.data;
      }
      // Nếu chưa có format, wrap lại
      return {
        isSuccess: false,
        statusCode: error.response.status || 500,
        message: error.response.data.message || error.response.data || "Có lỗi xảy ra",
        data: error.response.data.data || null,
      };
    }
    
    // Nếu không có response data, trả về error object với format chuẩn
    return Promise.reject({
      isSuccess: false,
      statusCode: error.response?.status || 500,
      message: error.message || "Có lỗi xảy ra",
      data: null,
    });
  }
);
export default instance;