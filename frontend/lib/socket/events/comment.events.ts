import { Comment } from "@/types/Post";
import { getSocket } from "../client";

export const onNewComment = (callback: (comment: Comment) => void) => {
  const socket = getSocket();
  if (!socket) return () => {};
  socket.on("new-comment", callback);
  return () => socket.off("new-comment", callback);
};
