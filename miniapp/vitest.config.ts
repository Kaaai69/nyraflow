import { defineConfig } from "vitest/config";
import path from "node:path";

// Алиас через process.cwd(), а не __dirname: конфиг грузится как ESM, где
// __dirname не определён. Vitest всегда запускается из корня пакета.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(process.cwd()) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
