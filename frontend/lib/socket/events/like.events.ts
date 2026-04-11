import { LikeData } from "@/types/Like";
import { getSocket } from "../client";

export const onLikeUpdated = (callback: (data: LikeData) => void) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on("like-updated", callback);
  return () => socket.off("like-updated", callback);
};

export const onFeedLikeUpdated = (callback: (data: LikeData) => void) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on("feed-like-updated", callback);
  return () => socket.off("feed-like-updated", callback);
};