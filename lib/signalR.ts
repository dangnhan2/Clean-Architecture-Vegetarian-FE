import * as signalR from "@microsoft/signalr";

export const createSignalRConnection = (accessToken?: string) => {
    return new signalR.HubConnectionBuilder()
         .withUrl(`${process.env.NEXT_PUBLIC_SIGNALR_HUB_URI}`, {
            accessTokenFactory: () => accessToken || localStorage.getItem("access_token") || "",
            withCredentials : true,          
         })
         .withAutomaticReconnect()
         .configureLogging(signalR.LogLevel.Information)
         .build()
        };