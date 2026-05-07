import { io, Socket } from "socket.io-client";
import { config } from "@/lib/config";
import { getAccessToken } from "@/app/actions/auth.actions";
import { Comment, Post } from "@/types/Post";
import { roomManager } from "./roomManager";

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let authPromise: Promise<boolean> | null = null;

export const getSocket = (): Socket | null => socket;

export const initSocket = async () => {
  if (socket && socket.connected) {
    console.log("Socket already connected");
    return socket;
  }

  if (socket && !socket.connected)
    console.log("socket is created but not connected");

  const SOCKET_URL = config.socketUrl;
  console.log("🔌 Initializing socket connection to:", SOCKET_URL);

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    autoConnect: true, // CHANGE: Let it connect immediately
    transports: ["websocket"], // CHANGE: Remove polling, WebSocket only
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5, // CHANGE: Reduce, 20 is overkill
    reconnectionDelay: 500, // CHANGE: Start faster (0.5 sec)
    reconnectionDelayMax: 5000, // CHANGE: Max 5 seconds, not 30
    timeout: 10000, // CHANGE: 10 seconds is enough
  });

  socket.on("connect", async () => {
    console.log("✅ Socket connected successfully, ID:", socket?.id);
    reconnectAttempts = 0;

    const accessToken = await getAccessToken();
    if (accessToken) {
      console.log("🔑 Authenticating socket with token...");
      // Create a promise that resolves when authenticated
      authPromise = new Promise((resolve) => {
        socket?.once("authenticated", (data) => {
          console.log("✅ Socket authenticated successfully:", data);
          resolve(true);
        });
        socket?.once("auth-error", (error) => {
          console.error("❌ Socket authentication error:", error);
          resolve(false);
        });
      });
      socket?.emit("authenticate", accessToken);
      await authPromise;

      // After authentication, subscribe to feed
      console.log("📡 Subscribing to feed after authentication");
      socket?.emit("subscribe-feed");
    } else {
      console.log("⚠️ No access token found for socket authentication");
    }
  });

  // Add this handler for reconnection
  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
  });

  socket.on("reconnect", async () => {
    console.log("🔄 Socket reconnected");

    const accessToken = await getAccessToken();
    if (accessToken && socket) {
      authPromise = new Promise((resolve) => {
        socket?.once("authenticated", (data) => {
          console.log("✅ Socket re-authenticated:", data);
          resolve(true);

          // Re-subscribe to feed
          socket?.emit("subscribe-feed");

          // 🔥 RE-JOIN ALL ACTIVE ROOMS
          const activeRooms = roomManager.getActiveRooms();
          console.log(
            `🔄 Re-joining ${activeRooms.length} active rooms:`,
            activeRooms,
          );

          activeRooms.forEach((roomName) => {
            if (roomName.startsWith("post-")) {
              const postId = roomName.replace("post-", "");
              socket?.emit("join-post", postId);
              console.log(`✅ Re-joined room: ${roomName}`);
            }
            // Add other room types here if needed
          });
        });

        socket?.once("auth-error", (error) => {
          console.error("❌ Socket re-authentication error:", error);
          resolve(false);
        });
      });

      socket?.emit("authenticate", accessToken);
    }
  });

  // Also handle disconnect to log which rooms were active
  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
    console.log("📝 Active rooms at disconnect:", roomManager.getActiveRooms());
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error.message);
    reconnectAttempts++;
  });

  if (typeof window !== "undefined" && (window as any).__SOCKET_TRACE__) {
    socket.onAny((event, ...args) => {
      // Filter out noisy events
      if (event !== "ping" && event !== "pong") {
        console.log(`📨 [SOCKET EVENT] ${event}`, args.length > 0 ? args : "");
      }
    });
  }

  return socket;
};

export const connectSocket = async () => {
  const socket = await initSocket();
  if (!socket.connected) {
    console.log("Connecting socket...");
    socket.connect();
    // Wait for authentication to complete
    if (authPromise) {
      await authPromise;
    }
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
