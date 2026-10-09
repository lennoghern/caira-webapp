import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const here = dirname(fileURLToPath(import.meta.url));

// Serves and builds the stories harness (see stories.ts). `defineConfig` comes
// from vitest/config, which re-exports Vite's: Vite is not a direct dependency.
export default defineConfig({
  root: here,
  base: "./",
  plugins: [react(), tailwindcss()],
  server: {
    port: 6007,
    strictPort: true,
    fs: { allow: [resolve(here, "../../..")] },
  },
  preview: { port: 6007, strictPort: true },
  build: {
    outDir: resolve(here, "../../../test-results/harness"),
    emptyOutDir: true,
  },
});
