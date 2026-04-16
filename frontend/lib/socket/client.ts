import { io, Socket } from "socket.io-client";
import { config } from "@/lib/config";
import { getAccessToken } from "@/app/actions/auth.actions";
import { Comment, Post } from "@/types/Post";

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const getSocket = (): Socket | null => socket;

export const initSocket = async () => {
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

  socket.on("connect", async () => {
    console.log("✅ Socket connected successfully");
    reconnectAttempts = 0;

    // Get token from HttpOnly cookie via Server Action
    const accessToken = await getAccessToken();
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

export const connectSocket = async () => {
  const socket = await initSocket();
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

// Event listeners
export const onReadersCountUpdated = (
  callback: (data: { postId: string; count: number }) => void,
) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on("readers-count-updated", callback);
  return () => socket.off("readers-count-updated", callback);
};

export const onPostJoined = (
  callback: (data: { postId: string; readerCount: number }) => void,
) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on("post-joined", callback);
  return () => socket.off("post-joined", callback);
};

export const onAuthenticated = (
  callback: (data: { userId: string }) => void,
) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on("authenticated", callback);
  return () => socket.off("authenticated", callback);
};

export const onSubscribed = (callback: (data: { channel: string }) => void) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on("subscribed", callback);
  return () => socket.off("subscribed", callback);
};

export const onNewPost = (callback: (post: Post) => void) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on("new-post", callback);
  return () => socket.off("new-post", callback);
};

export const onPostUpdated = (callback: (post: Post) => void) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on("post-updated", callback);
  return () => socket.off("post-updated", callback);
};

export const onPostDeleted = (callback: (data: { id: string }) => void) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on("post-deleted", callback);
  return () => socket.off("post-deleted", callback);
};

export const onNewComment = (callback: (comment: Comment) => void) => {
  const socket = getSocket();
  if (!socket) return () => {};
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
  if (!socket) return () => {};
  socket.on("like-updated", callback);
  return () => socket.off("like-updated", callback);
};

export const joinPostRoom = (postId: string) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit("join-post", postId);
  }
};

export const leavePostRoom = (postId: string) => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit("leave-post", postId);
  }
};

export const subscribeToFeed = () => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit("subscribe-feed");
  }
};

export const unsubscribeFromFeed = () => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit("unsubscribe-feed");
  }
};

export const onFollowersUpdated = (
  callback: (data: {
    userId: string;
    followersCount: number;
    isFollowing: boolean;
    followerId: string;
  }) => void,
) => {
  const socket = getSocket();
  if (!socket) return () => {};

  socket.on("followers-updated", callback);
  return () => socket.off("followers-updated", callback);
};

export const onFollowingUpdated = (
  callback: (data: { userId: string; followingCount: number }) => void,
) => {
  const socket = getSocket();
  if (!socket) return () => {};

  socket.on("following-updated", callback);
  return () => socket.off("following-updated", callback);
};
