import { getSocket } from "../client";

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
