import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DOCKER === "true" ? { output: "standalone" } : {}),
};

export default nextConfig;

