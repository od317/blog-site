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
};

export default nextConfig;