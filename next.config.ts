import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    qualities: [75, 92],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
