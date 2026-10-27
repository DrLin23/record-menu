import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // We only test server-side functions here, so no browser DOM is needed.
    environment: "node",
  },
});