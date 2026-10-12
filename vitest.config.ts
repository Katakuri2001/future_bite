import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // The database layer binds to Cloudflare's D1 at runtime and cannot be
    // instantiated under Node. What is testable here is the money and loyalty
    // arithmetic — pure functions that must never silently disagree with each
    // other — so those are extracted and tested directly.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});