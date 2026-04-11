import { getSocket } from "./client";

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

export const unsubscribeFromFeed = () => {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit("unsubscribe-feed");
  }
};
