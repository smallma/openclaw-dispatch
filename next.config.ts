import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 將這兩個變數顯式注入，確保 Edge Runtime (middleware) 能讀到
  env: {
    JWT_SECRET: process.env.JWT_SECRET!,
    WORKER_SECRET: process.env.WORKER_SECRET!,
  },
  // 允許 LAN 及外部 IP 透過 dev server 存取
  allowedDevOrigins: ['192.168.1.188', '118.163.7.100'],
};

export default nextConfig;
