import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "@playwright/test";

/** A one-pixel-high row of the page, in CSS px. */
export interface Strip {
  x: number;
  y: number;
  width: number;
}

export interface FrameReading {
  /** Time in the recording, in ms. */
  time: number;
  /** Darkest and lightest pixel of each strip in this frame, 0 to 255. */
  strips: Record<string, { min: number; max: number }>;
}

/**
 * Records a video of `run` and reads the given strips from every frame.
 *
 * Why video and not screenshots: a screenshot shows one instant, and an
 * animation is judged by all of them. It was a frame-by-frame reading that showed
 * a view transition dropping the backdrop filter of a glass surface for its whole
 * length (DECISIONS.md D-032). Video is also the only capture that includes
 * `backdrop-filter` in Playwright's Firefox (see painted.ts).
 *
 * The recording is decoded in Chromium whatever engine made it, so every project
 * that uses this needs Playwright's Chromium installed. Frames are read every
 * 40 ms, the recorder's frame interval.
 */
export async function recordStrips(
  browser: Browser,
  options: { baseURL: string; viewport: { width: number; height: number } },
  run: (page: Page) => Promise<Record<string, Strip>>,
): Promise<FrameReading[]> {
  const directory = mkdtempSync(join(tmpdir(), "caira-ui-video-"));
  try {
    const context = await browser.newContext({
      baseURL: options.baseURL,
      viewport: options.viewport,
      deviceScaleFactor: 1,
      recordVideo: { dir: directory, size: options.viewport },
    });
    const strips = await run(await context.newPage());
    await context.close();

    const file = readdirSync(directory).find((name) => name.endsWith(".webm"));
    if (!file) throw new Error("No video was recorded");
    const video = readFileSync(join(directory, file)).toString("base64");

    const decoder = await chromium.launch();
    try {
      const page = await decoder.newPage();
      return await page.evaluate(
        async ({ video, strips }) => {
          const bytes = Uint8Array.from(atob(video), (char) => char.charCodeAt(0));
          const element = document.createElement("video");
          element.muted = true;
          element.src = URL.createObjectURL(new Blob([bytes], { type: "video/webm" }));
          await new Promise<void>((resolve, reject) => {
            element.onloadeddata = () => resolve();
            element.onerror = () => reject(new Error("Could not decode the recorded video"));
          });
          const seek = (time: number) =>
            new Promise<void>((resolve) => {
              element.onseeked = () => resolve();
              element.currentTime = time;
            });
          // A recording has no duration until its end has been reached once.
          await seek(1e6);
          const end = element.currentTime;

          const canvas = document.createElement("canvas");
          canvas.width = element.videoWidth;
          canvas.height = element.videoHeight;
          const context = canvas.getContext("2d", { willReadFrequently: true })!;
          const frames: { time: number; strips: Record<string, { min: number; max: number }> }[] = [];
          for (let time = 0; time <= end; time += 0.04) {
            await seek(time);
            context.drawImage(element, 0, 0);
            const reading: Record<string, { min: number; max: number }> = {};
            for (const [name, strip] of Object.entries(strips)) {
              const { data } = context.getImageData(strip.x, strip.y, strip.width, 1);
              let min = 255;
              let max = 0;
              for (let index = 0; index < data.length; index += 4) {
                const value = Math.round((data[index]! + data[index + 1]! + data[index + 2]!) / 3);
                min = Math.min(min, value);
                max = Math.max(max, value);
              }
              reading[name] = { min, max };
            }
            frames.push({ time: Math.round(time * 1000), strips: reading });
          }
          return frames;
        },
        { video, strips },
      );
    } finally {
      await decoder.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
