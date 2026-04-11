import { Post } from "@/types/Post";
import { getSocket } from "../client";

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
