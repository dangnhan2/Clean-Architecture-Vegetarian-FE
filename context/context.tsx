"use client";

import { GetCartByUser, RefreshToken } from "@/services/api";
import { useState, createContext, useContext, useEffect } from "react";
import {refreshClient} from "@services/interceptor";

interface AuthContextType {
    user: IUser | undefined;
    setUser: React.Dispatch<React.SetStateAction<IUser | undefined>>;
    accessToken: string | undefined;
    setAccessToken: React.Dispatch<React.SetStateAction<string | undefined>>;
    isAuthen : boolean | undefined;
    setIsAuthen : React.Dispatch<React.SetStateAction<boolean | undefined>>;
    refresh : () => Promise<void>;
    cart : ICart | undefined;
    setCart : React.Dispatch<React.SetStateAction<ICart | undefined>>;
    fetchCart : () => Promise<void>;
}  

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider = ({children} : {children: React.ReactNode}) => {
    const [user, setUser] = useState<IUser>();
    const [accessToken, setAccessToken] = useState<string | undefined>();
    const [isAuthen, setIsAuthen] = useState<boolean | undefined>(false);
    const [cart, setCart] = useState<ICart>();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
      if (typeof window === "undefined" || isInitialized) return;

      // Kiểm tra nếu đang ở processing page (OAuth callback) - không gọi auto refresh
      // Processing page sẽ tự gọi refresh() sau khi lưu token
      const isProcessingPage = window.location.pathname === "/auth/processing";
      if (isProcessingPage) {
        setIsInitialized(true);
        return;
      }

      // Khi F5 / reload: luôn bootstrap auth từ localStorage và gọi refresh token (nếu có access_token)
      const token = localStorage.getItem("access_token");
      if (token) {
        setAccessToken(token);
        // Chỉ gọi refresh nếu chưa có user (tức là mới reload, chưa phải từ processing page)
        // Nếu đã có user, có nghĩa là vừa mới login xong, không cần refresh lại
        if (!user) {
          refresh().finally(() => {
            setIsInitialized(true);
          });
        } else {
          // Nếu đã có user, không cần refresh lại - chỉ set initialized
          setIsInitialized(true);
        }
      } else {
        setAccessToken(undefined);
        setUser(undefined);
        setIsAuthen(false);
        setIsInitialized(true);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const fetchCart = async () => {
      const id = user?.id
      if (id){
        let res = await GetCartByUser(id)         
        if (res.isSuccess && Number(res.statusCode) === 200){
          if (res.data)
          setCart(res.data)
        }
      }        
    }

    useEffect(() => {
      fetchCart()      
    }, [user?.id]);
    
    const refresh = async () => {
       try{
        let res = await RefreshToken();
        console.log(res);
        if (res && res.isSuccess){
            setUser(res.data?.data);
            const access_token = res.data?.accessToken
            if (access_token) {
              localStorage.setItem("access_token", access_token);
              setAccessToken(access_token);
            } else {
              // Nếu không có token mới, giữ nguyên token hiện tại trong localStorage
              const currentToken = localStorage.getItem("access_token");
              if (currentToken) {
                setAccessToken(currentToken);
              }
            }
            setIsAuthen(true);
        } else {
          // Refresh thất bại - nhưng KHÔNG xóa token và KHÔNG clear user
          // Giữ nguyên token và user để user vẫn ở lại trang hiện tại
          const currentToken = localStorage.getItem("access_token");
          if (currentToken) {
            // Vẫn giữ token và user nếu có token trong storage
            setAccessToken(currentToken);
            // Không clear user và isAuthen để user vẫn có thể sử dụng app
            // User sẽ chỉ bị logout khi thực sự không còn token
          } else {
            // Chỉ clear khi thực sự không còn token
            setUser(undefined);
            setAccessToken(undefined);
            setIsAuthen(false);
          }
        }
       }catch(err){
        console.error("Refresh token failed:", err);
        // Không xóa token và không clear user - để user vẫn ở lại trang hiện tại
        const currentToken = localStorage.getItem("access_token");
        if (currentToken) {
          // Vẫn giữ token nếu có token trong storage
          setAccessToken(currentToken);
          // Không clear user và isAuthen để user vẫn có thể sử dụng app
        } else {
          // Chỉ clear khi thực sự không còn token
          setUser(undefined);
          setAccessToken(undefined);
          setIsAuthen(false);
        }
       }
    }


    useEffect(() => {
        if (accessToken) {
          refreshClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
          localStorage.setItem("access_token", accessToken);
        } else {
          // Chỉ xóa token nếu thực sự không có token trong localStorage
          // Tránh xóa token khi component re-render hoặc state tạm thời undefined
          const tokenInStorage = localStorage.getItem("access_token");
          if (!tokenInStorage) {
            delete refreshClient.defaults.headers.common["Authorization"];
          }
        }
      }, [accessToken]);
    
      return (
        <AuthContext.Provider value={{ user, setUser, accessToken, setAccessToken, isAuthen, setIsAuthen, refresh, cart, setCart, fetchCart }}>
          {children}
        </AuthContext.Provider>
      );
    };

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}