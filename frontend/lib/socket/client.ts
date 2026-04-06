import { io, Socket } from "socket.io-client";
import { config } from "@/lib/config";

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const getSocket = () => {
  if (!socket) {
    const SOCKET_URL = config.socketUrl;
    console.log("🔌 Socket connecting to:", SOCKET_URL);

    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["polling", "websocket"],
      withCredentials: true, // This sends cookies automatically
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected successfully");
      reconnectAttempts = 0;
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      reconnectAttempts++;
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });
  }
  return socket;
};

export const connectSocket = () => {
  const socket = getSocket();

  if (!socket.connected) {
    console.log("Connecting socket...");
    socket.connect();

    // No manual authentication - cookies are sent automatically
    socket.once("connect", () => {
      console.log("Socket connected, cookies will be sent automatically");
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Keep your existing event listeners
export const onNewPost = (callback: (post: any) => void) => {
  const socket = getSocket();
  socket.on("new-post", callback);
  return () => socket.off("new-post", callback);
};

export const onPostUpdated = (callback: (post: any) => void) => {
  const socket = getSocket();
  socket.on("post-updated", callback);
  return () => socket.off("post-updated", callback);
};

export const onPostDeleted = (callback: (data: { id: string }) => void) => {
  const socket = getSocket();
  socket.on("post-deleted", callback);
  return () => socket.off("post-deleted", callback);
};

export const onNewComment = (callback: (comment: any) => void) => {
  const socket = getSocket();
  socket.on("new-comment", callback);
  return () => socket.off("new-comment", callback);
};

export const onLikeUpdated = (
  callback: (data: {
    postId: string;
    likeCount: number;
    userId: string;
    action: string;
  }) => void,
) => {
  const socket = getSocket();
  socket.on("like-updated", callback);
  return () => socket.off("like-updated", callback);
};

export const joinPostRoom = (postId: string) => {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit("join-post", postId);
  }
};

export const leavePostRoom = (postId: string) => {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit("leave-post", postId);
  }
};
