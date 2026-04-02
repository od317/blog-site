"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket/client";
import { useAuthStore } from "@/lib/store/authStore";

export default function SocketStatusPage() {
  const [status, setStatus] = useState("Disconnected");
  const [transport, setTransport] = useState("N/A");
  const { isAuthenticated } = useAuthStore(); // Remove token from here

  useEffect(() => {
    if (isAuthenticated) {
      // Only check isAuthenticated
      const socket = getSocket();

      const updateStatus = () => {
        setStatus(socket.connected ? "Connected" : "Disconnected");
        if (socket.connected && socket.io?.engine?.transport) {
          setTransport(socket.io.engine.transport.name);
        }
      };

      socket.on("connect", updateStatus);
      socket.on("disconnect", updateStatus);
      socket.on("connect_error", (err) => {
        setStatus(`Error: ${err.message}`);
      });

      updateStatus();

      return () => {
        socket.off("connect", updateStatus);
        socket.off("disconnect", updateStatus);
      };
    }
  }, [isAuthenticated]); // Remove token from dependency array

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Socket.IO Status</h1>
      <div className="space-y-2">
        <p>
          Status:{" "}
          <strong
            className={
              status === "Connected" ? "text-green-600" : "text-red-600"
            }
          >
            {status}
          </strong>
        </p>
        <p>Transport: {transport}</p>
        <p>Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
        <p>
          Render Free Tier Note: First connection may take 30-60 seconds to spin
          up
        </p>
      </div>
    </div>
  );
}
