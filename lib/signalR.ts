import * as signalR from "@microsoft/signalr";

export const createSignalRConnection = (accessToken?: string) => {
    return new signalR.HubConnectionBuilder()
         .withUrl("https://localhost:8081/hubs/notification", {
            accessTokenFactory: () => localStorage.getItem("access_token") || "",
            withCredentials : true
         })
         .withAutomaticReconnect()
         .configureLogging(signalR.LogLevel.Information)
         .build()
        };