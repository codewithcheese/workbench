import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import { svelteTesting } from "@testing-library/svelte/vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest-setup.ts"],
    browser: {
      enabled: false,
      headless: true,
      name: "chrome",
    },
    alias: {
      "@testing-library/svelte": "@testing-library/svelte/svelte5",
    },
  },
  optimizeDeps: {
    exclude: ["sqlocal"],
  },
  plugins: [
    sveltekit(),
    svelteTesting(),
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
    },
  ],
});
