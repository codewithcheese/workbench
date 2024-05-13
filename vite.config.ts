import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      headless: true,
      name: "chrome",
    },
  },
  optimizeDeps: {
    exclude: ["sqlocal"],
  },
  plugins: [
    sveltekit(),
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
