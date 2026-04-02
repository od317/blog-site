import { io, Socket } from "socket.io-client";
import { config } from "@/lib/config";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const SOCKET_URL = config.socketUrl;
    console.log("🔌 Socket connecting to:", SOCKET_URL);

    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      path: "/socket.io/",
      withCredentials: true,
    });
  }
  return socket;
};

export const connectSocket = (token: string) => {
  const socket = getSocket();

  if (!socket.connected) {
    socket.connect();

    socket.on("connect", () => {
      console.log("Socket connected to:", config.socketUrl);
      socket.emit("authenticate", token);
    });

    socket.on("authenticated", (data) => {
      console.log("Socket authenticated:", data);
      socket.emit("subscribe-feed");
    });

    socket.on("auth-error", (error) => {
      console.error("Socket auth error:", error);
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

// Event listeners for real-time updates
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
