import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone-сборка нужна только в образе — иначе .next/standalone не создаётся
  // и COPY в Dockerfile падает (тот же приём, что и в лендинге).
  ...(process.env.DOCKER === "true" ? { output: "standalone" } : {}),
  // Мини-апп открывается внутри вебвью Telegram, поэтому фреймы запрещать нельзя.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
