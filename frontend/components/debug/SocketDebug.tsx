// components/debug/SocketDebug.tsx
"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket/client";

export function SocketDebug() {
  const [status, setStatus] = useState({ connected: false, id: "N/A" });

  useEffect(() => {
    const check = () => {
      const s = getSocket();
      setStatus({
        connected: s?.connected || false,
        id: s?.id || "N/A",
      });
    };

    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== "production") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
      <div>Socket: {status.connected ? "🟢" : "🔴"}</div>
      <div>ID: {status.id}</div>
    </div>
  );
}
