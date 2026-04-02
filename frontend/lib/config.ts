import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "online-courses-dashobard-main-rx01ou.laravel.cloud.com",
      },
    ],
  },
  output: "standalone",
  // Hardcode for Render deployment
  env: {
    NEXT_PUBLIC_API_URL: "https://blog-backend-5dai.onrender.com/api",
    NEXT_PUBLIC_WS_URL: "https://blog-backend-5dai.onrender.com",
    NEXT_PUBLIC_SOCKET_URL: "https://blog-backend-5dai.onrender.com",
  },
};

console.log("🔨 Next.js Build with hardcoded Render URLs");
console.log("API URL:", "https://blog-backend-5dai.onrender.com/api");

export default nextConfig;
