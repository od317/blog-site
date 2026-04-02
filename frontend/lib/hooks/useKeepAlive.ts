import { useEffect } from "react";
import { getSocket } from "@/lib/socket/client";

export function useKeepAlive() {
  useEffect(() => {
    // Send a ping every 2 minutes to keep the service alive
    const interval = setInterval(() => {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit("ping");
        console.log("📡 Keep-alive ping sent");
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);
}
