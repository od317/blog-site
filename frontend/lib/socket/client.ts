import { io, Socket } from "socket.io-client";
import { config } from "@/lib/config";

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Helper to get cookie value
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

export const getSocket = (): Socket | null => socket;

export const initSocket = () => {
  if (socket) return socket;

  const SOCKET_URL = config.socketUrl;
  console.log("🔌 Socket connecting to:", SOCKET_URL);

  socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["polling", "websocket"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 30000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected successfully");
    reconnectAttempts = 0;

    const accessToken = getCookie("accessToken");
    if (accessToken) {
      console.log("🔑 Authenticating socket with token...");
      socket?.emit("authenticate", accessToken);
    } else {
      console.log("⚠️ No access token found for socket authentication");
    }
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error.message);
    reconnectAttempts++;
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  return socket;
};

export const connectSocket = () => {
  const socket = initSocket();
  if (!socket.connected) {
    console.log("Connecting socket...");
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onReadersCountUpdated = (
  callback: (data: { postId: string; count: number }) => void,
) => {
  const socket = getSocket();
  if (!socket) return;
  socket.on("readers-count-updated", callback);
  return () => socket.off("readers-count-updated", callback);
};

export const onPostJoined = (
  callback: (data: { postId: string; readerCount: number }) => void,
) => {
  const socket = getSocket();
  if (!socket) return;
  socket.on("post-joined", callback);
  return () => socket.off("post-joined", callback);
};
