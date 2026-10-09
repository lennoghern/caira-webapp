import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "@playwright/test";
import type { Rgba } from "../../src/test/color";
import { openStory, samplePixels, type Globals } from "./support";

/**
 * Reads the color each `[data-sample]` element was really painted with.
 *
 * Chromium and WebKit: from a screenshot.
 *
 * Firefox: from a frame of a recorded video. Measured here on 2026-10-08 with
 * Playwright's Firefox 157: its screenshots leave out every `backdrop-filter`
 * effect (the surface comes back as the bare tint over the raw backdrop), while
 * the video, which records what the compositor shows, includes them and matches
 * the model. A screenshot would therefore report a contrast failure that is not
 * on screen. The frame is decoded in Chromium, so the Firefox project needs
 * Playwright's Chromium installed too. VP8 compression moves a flat color by a
 * level or two; the callers' tolerance allows for it.
 */
export async function paintedSamples(
  page: Page,
  browser: Browser,
  engine: string,
  baseURL: string,
  storyId: string,
  globals: Globals,
  at: { x: number; y: number },
): Promise<Map<string, Rgba>> {
  if (engine !== "firefox") {
    await openStory(page, storyId, globals);
    const samples = new Map<string, Rgba>();
    for (const element of await page.locator("[data-sample]").all()) {
      const name = (await element.getAttribute("data-sample"))!;
      samples.set(name, await samplePixels(page, element, at));
    }
    return samples;
  }

  const directory = mkdtempSync(join(tmpdir(), "caira-ui-video-"));
  try {
    const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
    const context = await browser.newContext({
      baseURL,
      viewport,
      deviceScaleFactor: 1,
      recordVideo: { dir: directory, size: viewport },
    });
    const recorded = await context.newPage();
    await openStory(recorded, storyId, globals);
    const points = await recorded.locator("[data-sample]").evaluateAll(
      (elements, fraction) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return {
            name: element.getAttribute("data-sample")!,
            x: Math.round(box.x + box.width * fraction.x),
            y: Math.round(box.y + box.height * fraction.y),
          };
        }),
      at,
    );
    // Long enough for the encoder to have several settled frames.
    await recorded.waitForTimeout(2500);
    await context.close();

    const file = readdirSync(directory).find((name) => name.endsWith(".webm"));
    if (!file) throw new Error("Firefox recorded no video");
    const video = readFileSync(join(directory, file)).toString("base64");

    const decoder = await chromium.launch();
    try {
      const decoderPage = await decoder.newPage();
      const colors = await decoderPage.evaluate(
        async ({ video, points }) => {
          const bytes = Uint8Array.from(atob(video), (char) => char.charCodeAt(0));
          const element = document.createElement("video");
          element.muted = true;
          element.src = URL.createObjectURL(new Blob([bytes], { type: "video/webm" }));
          await new Promise<void>((resolve, reject) => {
            element.onloadeddata = () => resolve();
            element.onerror = () => reject(new Error("Could not decode the recorded video"));
          });
          const duration = Number.isFinite(element.duration) ? element.duration : 2;
          await new Promise<void>((resolve) => {
            element.onseeked = () => resolve();
            element.currentTime = Math.max(0, duration - 0.3);
          });
          const canvas = document.createElement("canvas");
          canvas.width = element.videoWidth;
          canvas.height = element.videoHeight;
          const context = canvas.getContext("2d")!;
          context.drawImage(element, 0, 0);
          return points.map((point) => {
            const { data } = context.getImageData(point.x - 3, point.y - 3, 6, 6);
            const sum = [0, 0, 0];
            for (let index = 0; index < data.length; index += 4) {
              sum[0]! += data[index]!;
              sum[1]! += data[index + 1]!;
              sum[2]! += data[index + 2]!;
            }
            const pixels = data.length / 4;
            return { name: point.name, r: sum[0]! / pixels / 255, g: sum[1]! / pixels / 255, b: sum[2]! / pixels / 255 };
          });
        },
        { video, points },
      );
      return new Map(colors.map(({ name, r, g, b }) => [name, { r, g, b, a: 1 }]));
    } finally {
      await decoder.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
