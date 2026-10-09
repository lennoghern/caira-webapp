import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit, interaction and structural accessibility tests, in jsdom.
// jsdom has no layout and no computed colors, so nothing here can prove
// contrast or focus visibility: see ARCHITECTURE.md section 10. Token contrast
// is covered by src/styles/contrast.test.ts, and real rendering by the
// Playwright suite in tests/browser.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
