import { expect, test, type Page } from "@playwright/test";
import { openStory } from "./support";
import { recordStrips } from "./video";

/**
 * A glass surface that grows and shrinks (`GlassSurface expanded` with
 * `GlassReveal`), in a real engine. The fixture is one pill over hard black and
 * white stripes: if the glass ever lost its blur or tint, the stripes would show
 * through sharp.
 */

const FIXTURE = "tests-fixtures--expansion";

const slowDown = (page: Page, ms: number) =>
  page.evaluate((value) => document.documentElement.style.setProperty("--motion-duration-morph", `${value}ms`), ms);

const pillBox = async (page: Page) => (await page.getByTestId("pill").boundingBox())!;

const pillRadius = (page: Page) =>
  page.getByTestId("pill").evaluate((element) => Number.parseFloat(getComputedStyle(element).borderTopLeftRadius));

test("the glass keeps its blur and tint on every frame while it changes size", async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const frames = await recordStrips(browser, { baseURL: baseURL!, viewport: { width: 520, height: 300 } }, async (page) => {
    await openStory(page, FIXTURE, { refraction: "off" });
    await slowDown(page, 1200);
    const box = await pillBox(page);
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: "Now playing" }).click();
    await page.waitForTimeout(1800);
    await page.getByRole("button", { name: "Now playing" }).click();
    await page.waitForTimeout(1800);
    return {
      // The top padding of the collapsed pill: inside the surface in both states, clear of text.
      inside: { x: Math.round(box.x + 20), y: Math.round(box.y + 4), width: Math.round(box.width - 40) },
      // Below the collapsed pill: bare stripes until the surface grows over it.
      grown: { x: Math.round(box.x + 20), y: Math.round(box.y + box.height + 30), width: Math.round(box.width - 40) },
    };
  });

  // The first frames of a recording are blank; start where the stripes are on screen.
  const start = frames.findIndex((frame) => frame.strips.grown!.max - frame.strips.grown!.min > 150);
  expect(start, "the stripes never appeared in the recording").toBeGreaterThanOrEqual(0);
  const shown = frames.slice(start);
  const steady = shown[0]!.strips.inside!;
  // Blurred glass over stripes is one even tone.
  expect(steady.max - steady.min).toBeLessThanOrEqual(16);

  // The recording must contain the change itself: the surface covers the lower strip, then leaves it.
  const covered = shown.filter((frame) => frame.strips.grown!.max - frame.strips.grown!.min <= 40);
  expect(covered.length, "the surface never grew over the lower strip").toBeGreaterThan(5);
  const last = shown.at(-1)!.strips.grown!;
  expect(last.max - last.min, "the surface never shrank back").toBeGreaterThan(150);

  // And on every frame, moving or not, the inside of the surface is the same even tone.
  for (const frame of shown) {
    const inside = frame.strips.inside!;
    expect(inside.max - inside.min, `stripes show through at ${frame.time} ms`).toBeLessThanOrEqual(16);
    expect(Math.abs(inside.min - steady.min), `the tint changed at ${frame.time} ms`).toBeLessThanOrEqual(12);
  }
});

test("the element itself changes size and corner radius", async ({ page }) => {
  await openStory(page, FIXTURE);
  await slowDown(page, 1500);
  const collapsed = { ...(await pillBox(page)), radius: await pillRadius(page) };

  await page.getByRole("button", { name: "Now playing" }).click();
  await page.waitForTimeout(500);
  const moving = { ...(await pillBox(page)), radius: await pillRadius(page) };
  await expect(page.getByRole("link", { name: "Open the queue" })).toBeVisible();
  await expect.poll(async () => (await page.getByTestId("pill").evaluate((element) => element.getAnimations({ subtree: true }).length))).toBe(0);
  const expanded = { ...(await pillBox(page)), radius: await pillRadius(page) };

  expect(expanded.height).toBeGreaterThan(collapsed.height + 30);
  expect(expanded.width).toBeGreaterThan(collapsed.width + 30);
  expect(expanded.radius).toBeLessThan(collapsed.radius);
  // Mid-flight the real element is in between on all three, not at either end.
  expect(moving.height).toBeGreaterThan(collapsed.height + 2);
  expect(moving.height).toBeLessThan(expanded.height - 2);
  expect(moving.width).toBeGreaterThan(collapsed.width + 2);
  expect(moving.width).toBeLessThan(expanded.width - 2);
  expect(moving.radius).toBeLessThan(collapsed.radius);
  expect(moving.radius).toBeGreaterThan(expanded.radius);
});

test("it takes input while it moves and turns around from where it is", async ({ page }) => {
  await openStory(page, FIXTURE);
  await slowDown(page, 2000);
  const collapsed = await pillBox(page);
  const button = page.getByRole("button", { name: "Now playing" });

  await button.click();
  await page.waitForTimeout(700);
  const before = await pillBox(page);
  // A second press lands at once: nothing is waiting for the animation to end.
  // From the keyboard, because Playwright itself refuses to click an element
  // that is still moving; a person's click has no such rule.
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "false", { timeout: 500 });
  await page.waitForTimeout(150);
  const after = await pillBox(page);

  expect(before.height).toBeGreaterThan(collapsed.height + 2);
  // It shrinks from the size it had reached; it does not jump to the full size first.
  expect(after.height).toBeLessThanOrEqual(before.height + 1);
  expect(after.height).toBeGreaterThan(collapsed.height);
  await expect.poll(async () => Math.round((await pillBox(page)).height)).toBe(Math.round(collapsed.height));
});

test("collapsed content is hidden and out of the tab order; focus stays on the control", async ({ page }) => {
  await openStory(page, FIXTURE);
  const button = page.getByRole("button", { name: "Now playing" });
  // By role: finds the link only while it is exposed to assistive technology.
  const link = page.getByRole("link", { name: "Open the queue" });
  // By selector: finds the element whether it is exposed or not.
  const linkElement = page.locator('a[href="#queue"]');

  await expect(linkElement).toHaveCount(1);
  await expect(link).toHaveCount(0);
  await expect(linkElement).toBeHidden();
  await button.focus();
  await page.keyboard.press("Tab");
  await expect(linkElement).not.toBeFocused();

  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(button).toBeFocused();
  await expect(link).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(linkElement).toBeFocused();

  await button.focus();
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
  await expect(link).toBeHidden();
});

test("reduced motion: the size changes at once", async ({ page }) => {
  await openStory(page, FIXTURE, { motion: "reduced" });
  const collapsed = await pillBox(page);
  await page.getByRole("button", { name: "Now playing" }).click();
  // Two frames after the press it is already at its final size.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const first = await pillBox(page);
  await page.waitForTimeout(600);
  const settled = await pillBox(page);
  expect(first.height).toBeGreaterThan(collapsed.height + 30);
  expect(Math.round(first.height)).toBe(Math.round(settled.height));
  expect(Math.round(first.width)).toBe(Math.round(settled.width));
});
