"use client";

import { useEffect, useState } from "react";
import { getSocket, connectSocket } from "@/lib/socket/client";
import { useAuthStore } from "@/lib/store/authStore";

export function SocketDebug() {
  const [status, setStatus] = useState("Disconnected");
  const { user } = useAuthStore();

  useEffect(() => {
    const checkSocket = async () => {
      const socket = await connectSocket();

      if (socket) {
        setStatus(socket.connected ? "Connected" : "Connecting");

        socket.on("connect", () => {
          console.log("🎯 SOCKET CONNECTED EVENT");
          setStatus("Connected");
        });

        socket.on("disconnect", () => {
          console.log("🎯 SOCKET DISCONNECTED EVENT");
          setStatus("Disconnected");
        });

        socket.on("authenticated", (data) => {
          console.log("🎯 SOCKET AUTHENTICATED EVENT", data);
        });

        // Listen for all events for debugging
        socket.onAny((event, ...args) => {
          console.log(`🎯 SOCKET EVENT: ${event}`, args);
        });
      }
    };

    checkSocket();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-2 rounded-lg text-xs z-50">
      <div>Socket: {status}</div>
      <div>User: {user?.id?.slice(0, 8)}...</div>
    </div>
  );
}
