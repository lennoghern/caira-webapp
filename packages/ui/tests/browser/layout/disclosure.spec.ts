import { expect, test, type Page } from "@playwright/test";
import { openStory } from "../support";
import { computed, expectStoriesRenderClean, resolved } from "./shared";

/**
 * `Disclosure` in a real engine: the things jsdom cannot see.
 *
 * What this proves: which way the glyph points in each state and direction,
 * that Tab skips collapsed content (it rests on `hidden="until-found"`, which
 * jsdom does not implement), that the view really grows through sizes in
 * between and ends at the size of its content, that reduced motion makes the
 * change immediate, and the button form's edge under forced colors.
 * What it does not prove: contrast (stories-axe.spec.ts, contrast.test.ts).
 *
 * Clocks (DECISIONS.md D-041): the heights during the change are recorded by
 * the page, frame by frame, from the click that starts it, and fetched
 * afterwards. Nothing here waits a fixed time and then reads.
 */

const STORY = "layout-disclosure--triangle-and-button";

test("every Disclosure story renders without a console message", async ({ page }) => {
  await expectStoriesRenderClean(page, "layout-disclosure--", ["playground", "triangle-and-button", "group", "theme-states"], "[data-variant]");
});

const glyph = (page: Page, testId: string) => page.getByTestId(testId).getByRole("button").locator("svg");

test("the triangle points inward from the leading edge when closed and down when open", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  expect(await computed(glyph(page, "collapsed"), "rotate")).toBe("none");
  expect(await computed(glyph(page, "expanded"), "rotate")).toBe("90deg");
  expect(await computed(glyph(page, "collapsed"), "scale")).toBe("none");

  // Mirrored, the same glyph points left, and a quarter turn the other way brings it down.
  await openStory(page, STORY, { appearance: "light", direction: "rtl" });
  expect(await computed(glyph(page, "collapsed"), "scale")).toBe("-1 1");
  expect(await computed(glyph(page, "expanded"), "rotate")).toBe("-90deg");
});

test("the button points down when closed and up when open", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const button = page.getByRole("button", { name: "Show more locations" });
  expect(await computed(button.locator("svg"), "rotate")).toBe("none");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => computed(button.locator("svg"), "rotate")).toBe("180deg");
});

test("Tab skips the content of a closed disclosure and enters the content of an open one", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  await page.getByRole("button", { name: "Advanced options" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Shown from the start" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("expanded").getByRole("checkbox", { name: "Include presenter notes" })).toBeFocused();
  // The disabled one is not a tab stop; after the open content comes the next control.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After the disclosures" })).toBeFocused();
});

interface Flight {
  duration: number;
  /** One entry per frame the page drew, timed from the frame in which the panel was first told to change. */
  frames: { at: number; height: number }[];
  final: number;
  content: number;
}

/**
 * Has the page record the panel's height on every frame, from the next press of the trigger until
 * well after the change. Times are on the page's clock and count from the first frame in which React
 * Aria has given the panel its new size (`--disclosure-panel-height` differs from what it was at the
 * press): measured in Chromium, that is 4 to 21 ms after the click event, which fires before React
 * has committed anything. Frames from before that moment are dropped.
 */
async function recordNextChange(page: Page, testId: string): Promise<void> {
  await page.getByTestId(testId).evaluate((root) => {
    const trigger = root.querySelector("button")!;
    const panel = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    const size = () => panel.style.getPropertyValue("--disclosure-panel-height");
    (window as unknown as { __flight: Promise<unknown> }).__flight = new Promise((resolve) => {
      trigger.addEventListener(
        "click",
        () => {
          const before = size();
          const duration = Number.parseFloat(getComputedStyle(panel).transitionDuration) * 1000;
          const frames: { at: number; height: number }[] = [];
          let told: number | null = null;
          const tick = () => {
            const now = performance.now();
            if (told === null && size() !== before) told = now;
            if (told !== null) frames.push({ at: now - told, height: panel.getBoundingClientRect().height });
            if (told === null || now - told < duration + 400) requestAnimationFrame(tick);
            else
              resolve({
                duration,
                frames,
                final: panel.getBoundingClientRect().height,
                content: panel.firstElementChild!.getBoundingClientRect().height,
              });
          };
          requestAnimationFrame(tick);
        },
        { once: true },
      );
    });
  }, undefined);
}

const flight = (page: Page) => page.evaluate(() => (window as unknown as { __flight: Promise<Flight> }).__flight);

test("the view grows through sizes in between and ends at the size of its content", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  await page.evaluate(() => document.documentElement.style.setProperty("--motion-duration-base", "600ms"));
  await recordNextChange(page, "collapsed");
  await page.getByRole("button", { name: "Advanced options" }).click();
  const result = await flight(page);

  expect(result.duration).toBe(600);
  expect(result.content).toBeGreaterThan(40);
  expect(result.final).toBeCloseTo(result.content, 0);
  // Frames well inside the change, by the page's own clock, are strictly between closed and open.
  const middle = result.frames.filter((frame) => frame.at > 150 && frame.at < 350);
  expect(middle.length, `frames between 150 and 350 ms: ${JSON.stringify(result.frames.map((frame) => Math.round(frame.at)))}`).toBeGreaterThan(0);
  for (const frame of middle) {
    expect(frame.height).toBeGreaterThan(2);
    expect(frame.height).toBeLessThan(result.content - 2);
  }
  // It never overshoots.
  expect(Math.max(...result.frames.map((frame) => frame.height))).toBeLessThanOrEqual(result.content + 0.5);
});

test("it shrinks the same way, and the closed content is then hidden", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  await page.evaluate(() => document.documentElement.style.setProperty("--motion-duration-base", "600ms"));
  await recordNextChange(page, "expanded");
  const trigger = page.getByRole("button", { name: "Shown from the start" });
  await trigger.click();
  const result = await flight(page);
  const middle = result.frames.filter((frame) => frame.at > 150 && frame.at < 350);
  expect(middle.length).toBeGreaterThan(0);
  for (const frame of middle) {
    expect(frame.height).toBeGreaterThan(2);
    expect(frame.height).toBeLessThan(result.content - 2);
  }
  expect(result.final).toBe(0);
  await expect(page.getByTestId("expanded").getByRole("checkbox")).toHaveCount(0);
});

test("with reduced motion the size changes at once", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light", motion: "reduced" });
  await recordNextChange(page, "collapsed");
  await page.getByRole("button", { name: "Advanced options" }).click();
  const result = await flight(page);
  // The duration token is 0.01 ms, not 0, so that the end of the transition is still reported
  // (motion.css).
  expect(result.duration).toBeLessThan(1);
  expect(result.final).toBeCloseTo(result.content, 0);
  // "At once", on the page's clock: 100 ms after the panel is given its size it is at full size, and
  // stays there. Captured over 12 runs in Chromium: one or two frames still at 0 (once, one frame
  // at half size) in the first 15 ms, the frame in which the transition starts, then full size.
  // With the motion left on, the same frames would be partway through 250 ms.
  const after = result.frames.filter((frame) => frame.at >= 100);
  expect(after.length, `frames: ${JSON.stringify(result.frames.map((frame) => [Math.round(frame.at), Math.round(frame.height)]))}`).toBeGreaterThan(5);
  for (const frame of after) expect(frame.height, `at ${Math.round(frame.at)} ms`).toBeCloseTo(result.content, 0);
});

test("a disabled trigger takes the tertiary label color", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const trigger = page.getByRole("button", { name: "Unavailable" });
  await expect(trigger).toBeDisabled();
  expect(await computed(trigger, "color")).toBe(await resolved(trigger, "color", "var(--label-tertiary)"));
});

test("forced colors gives the button form an edge", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openStory(page, STORY, { appearance: "light" });
  const button = page.getByRole("button", { name: "Show more locations" });
  expect(await computed(button, "border-top-style")).toBe("solid");
  expect(await computed(button, "border-top-width")).toBe("1px");
});
