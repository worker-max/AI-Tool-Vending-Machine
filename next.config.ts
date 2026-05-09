import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Support hostname split between marketing (vendai.com) and admin (control.vendai.com).
  // Routing is handled in src/middleware.ts; no rewrites required here.
};

export default nextConfig;
