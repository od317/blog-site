// Get config from environment variables
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
};

// Log config for debugging (only in browser)
if (typeof window !== 'undefined') {
  console.log('🔧 App Config:', {
    apiUrl: config.apiUrl,
    wsUrl: config.wsUrl,
    socketUrl: config.socketUrl,
    fromEnv: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
      NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    }
  });
}