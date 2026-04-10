import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // ปิดโหมดนี้เพื่อไม่ให้ React รัน useEffect หรืออนิเมชั่นซ้ำ 2 ครั้งตอนพัฒนาครับ
};

export default nextConfig;