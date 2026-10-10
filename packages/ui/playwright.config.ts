import { defineConfig, devices } from "@playwright/test";

const PORT = 6007;

/**
 * Real-browser checks: the things jsdom cannot see (ARCHITECTURE.md section 10).
 *
 * The tests open the stories through the harness in tests/browser/harness, which
 * renders the Storybook story files with Storybook's portable-stories API. Run
 * `pnpm test:browser`; it builds the harness first.
 *
 * Engines: `PLAYWRIGHT_ENGINES=chromium,firefox,webkit` selects projects.
 * Chromium is the default because it is the only engine known to launch on
 * every development machine here; see PROGRESS.md for what ran where.
 *
 * Workers: one, fixed here (DECISIONS.md D-042). Playwright's default is half the
 * logical processors, four on the development machine (4 cores, 8 threads, 6 GB).
 * Four browsers saturated the processor, which made protocol round trips in
 * Firefox take up to a second instead of a few hundredths (D-041), and ran the
 * machine out of memory. Two is the ceiling set for this machine and was not
 * measured; `--workers` on the command line still overrides the value.
 */
const engines = (process.env.PLAYWRIGHT_ENGINES ?? "chromium").split(",").map((name) => name.trim());

const projects = [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
  // The installed browsers, for machines where Playwright's own builds cannot start.
  { name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  { name: "msedge", use: { ...devices["Desktop Edge"], channel: "msedge" } },
].filter((project) => engines.includes(project.name));

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./test-results/playwright",
  fullyParallel: true,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    // A fixed scale keeps pixel sampling exact.
    deviceScaleFactor: 1,
  },
  projects,
  webServer: {
    command: `pnpm exec vite preview -c tests/browser/harness/vite.config.mts --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
