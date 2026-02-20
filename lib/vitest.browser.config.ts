import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "/@": resolve(__dirname, "./src"),
    },
    preserveSymlinks: true,
  },
  test: {
    include: ["**/*.test.ts"],
    browser: {
      enabled: true,
      provider: "playwright",
      // https://vitest.dev/guide/browser/playwright
      instances: [
        {
          name: "chromium",
          browser: "chromium",
        },
      ],
    },
  },
});
