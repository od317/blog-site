export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
};

// Log config for debugging (only in development)
if (typeof window !== "undefined") {
  console.log("🔧 App Config:", config);
}
