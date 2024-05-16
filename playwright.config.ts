import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  webServer: {
    command: "npm run dev -- --port=9999",
    port: 9999,
  },
  testDir: "test-e2e",
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
};

export default config;
