import { expect, test, type Page } from "@playwright/test";
import { openStory } from "./support";
import { recordStrips } from "./video";

/**
 * A glass surface that grows and shrinks (`GlassSurface expanded` with
 * `GlassReveal`), in a real engine. The fixture is one pill over hard black and
 * white stripes: if the glass ever lost its blur or tint, the stripes would show
 * through sharp.
 *
 * Clocks. Anything whose value depends on when it is read is read by the page
 * itself, on the morph's own clock, and only fetched afterwards. A reading taken
 * from here after a fixed wait is as late as the protocol is slow: measured in
 * Firefox on this machine, one round trip takes 18 to 52 ms with one worker and
 * 72 to 1215 ms with four workers and the processor at 100%, which put a
 * "500 ms" reading anywhere from 625 to 1745 ms into a 1500 ms morph
 * (PROGRESS.md, "Batch 1"; DECISIONS.md D-041). So a wait on this side is only
 * ever a minimum, and nothing here polls for the end of a morph: the page
 * reports it.
 */

const FIXTURE = "tests-fixtures--expansion";

// Firefox is slow to drive while other workers are recording video: one of these
// took 40 s in a full run and 16 s alone. More time, the same assertions.
test.describe.configure({ timeout: 90_000 });

const slowDown = (page: Page, ms: number) =>
  page.evaluate((value) => document.documentElement.style.setProperty("--motion-duration-morph", `${value}ms`), ms);

const pillBox = async (page: Page) => (await page.getByTestId("pill").boundingBox())!;

const pillRadius = (page: Page) =>
  page.getByTestId("pill").evaluate((element) => Number.parseFloat(getComputedStyle(element).borderTopLeftRadius));

/** The surface as the page saw it on one of its own frames. Times are in ms on the page's clock. */
interface Reading {
  /** How far into the morph, by the `currentTime` of its own transition. */
  time: number;
  width: number;
  height: number;
  radius: number;
}

/** What the page saw of a morph that was turned around by a key press. Times are in ms from the start of the first morph. */
interface Flight {
  /** The key press as it reached the page: what had focus, whether the first morph was still running, the size reached. */
  key: { at: number; onButton: boolean; running: boolean; height: number };
  /** The change of state the press caused, and the size the surface had at that moment. */
  flip: { at: number; height: number };
  /** Every frame the page drew, from the start of the first morph to the end of the second. */
  frames: { at: number; height: number }[];
  /** The first frame after the last morph ended. */
  settled: { at: number; height: number };
}

type RecordingWindow = Window & { __reading?: Promise<Reading | null>; __flight?: Promise<Flight> };

/**
 * Arms one reading, taken by the page on the first frame where the morph's own
 * clock is at or past `at` ms. Call it before starting the morph and await the
 * function it returns afterwards. The reading is `null` if the morph ended
 * without the page drawing such a frame.
 */
async function armReading(page: Page, at: number): Promise<() => Promise<Reading | null>> {
  await page.evaluate((at) => {
    const pill = document.querySelector('[data-testid="pill"]')!;
    const morph = () =>
      pill
        .getAnimations({ subtree: true })
        .find((animation) => animation instanceof CSSTransition && animation.transitionProperty === "grid-template-rows");
    (window as RecordingWindow).__reading = new Promise((resolve) => {
      let started = false;
      const frame = () => {
        const transition = morph();
        if (transition) {
          started = true;
          const time = Number(transition.currentTime);
          if (time >= at) {
            const rect = pill.getBoundingClientRect();
            const radius = Number.parseFloat(getComputedStyle(pill).borderTopLeftRadius);
            resolve({ time, width: rect.width, height: rect.height, radius });
            return;
          }
        } else if (started) {
          resolve(null);
          return;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }, at);
  return () => page.evaluate(() => (window as RecordingWindow).__reading!);
}

/**
 * Has the page keep its own record of a morph that a key press turns around:
 * when Enter arrived, when `aria-expanded` changed, and the height on every
 * frame until the surface came to rest. Call it before starting the morph and
 * await the function it returns once the state has changed.
 */
async function recordFlight(page: Page): Promise<() => Promise<Flight>> {
  await page.evaluate(() => {
    const pill = document.querySelector('[data-testid="pill"]')!;
    const button = pill.querySelector("button")!;
    let start: number | null = null;
    let key: Flight["key"] | null = null;
    let flip: Flight["flip"] | null = null;
    const frames: Flight["frames"] = [];
    const since = () => performance.now() - start!;
    const height = () => pill.getBoundingClientRect().height;
    const morphing = () =>
      pill
        .getAnimations({ subtree: true })
        .some((animation) => animation instanceof CSSTransition && animation.transitionProperty === "grid-template-rows");

    pill.addEventListener("transitionrun", () => (start ??= performance.now()));
    // Capture phase: this runs before the button handles the key.
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Enter" || start === null || key) return;
        key = { at: since(), onButton: document.activeElement === button, running: morphing(), height: height() };
      },
      true,
    );
    new MutationObserver(() => {
      if (key && !flip && button.getAttribute("aria-expanded") === "false") flip = { at: since(), height: height() };
    }).observe(button, { attributes: true, attributeFilter: ["aria-expanded"] });

    (window as RecordingWindow).__flight = new Promise((resolve) => {
      const frame = () => {
        if (start !== null) {
          const drawn = { at: since(), height: height() };
          frames.push(drawn);
          if (key && flip && !morphing()) {
            resolve({ key, flip, frames, settled: drawn });
            return;
          }
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  });
  return () => page.evaluate(() => (window as RecordingWindow).__flight!);
}

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

  // Mid-flight is read by the page, 500 ms into its own 1500 ms morph (see "Clocks" above).
  const midFlight = await armReading(page, 500);
  await page.getByRole("button", { name: "Now playing" }).click();
  const moving = await midFlight();
  if (!moving) throw new Error("The page drew no frame between 500 ms and the end of the 1500 ms morph");
  await expect(page.getByRole("link", { name: "Open the queue" })).toBeVisible();
  // The page says when every transition of the surface has run to its end.
  await page.getByTestId("pill").evaluate(async (element) => {
    await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished));
  });
  const expanded = { ...(await pillBox(page)), radius: await pillRadius(page) };

  expect(expanded.height).toBeGreaterThan(collapsed.height + 30);
  expect(expanded.width).toBeGreaterThan(collapsed.width + 30);
  expect(expanded.radius).toBeLessThan(collapsed.radius);
  // Mid-flight the real element is in between on all three, not at either end.
  const when = `read ${Math.round(moving.time)} ms into the morph`;
  // Printed on every run, so a drift of the page's own clock is visible before it fails.
  console.log(`${test.info().project.name} | mid-flight ${when}: height ${moving.height.toFixed(1)} of ${collapsed.height} to ${expanded.height}`);
  expect(moving.height, when).toBeGreaterThan(collapsed.height + 2);
  expect(moving.height, when).toBeLessThan(expanded.height - 2);
  expect(moving.width, when).toBeGreaterThan(collapsed.width + 2);
  expect(moving.width, when).toBeLessThan(expanded.width - 2);
  expect(moving.radius, when).toBeLessThan(collapsed.radius);
  expect(moving.radius, when).toBeGreaterThan(expanded.radius);
});

test("it takes input while it moves and turns around from where it is", async ({ page }) => {
  await openStory(page, FIXTURE);
  await slowDown(page, 2000);
  const collapsed = await pillBox(page);
  const button = page.getByRole("button", { name: "Now playing" });
  // The page keeps the record; every time below is on its clock (see "Clocks" above).
  const landed = await recordFlight(page);

  await button.click();
  // A minimum, for the surface to have grown visibly. Being late only moves the press further into the morph.
  await page.waitForTimeout(300);
  // A second press, from the keyboard, because Playwright itself refuses to click
  // an element that is still moving; a person's click has no such rule.
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  const { key, flip, frames, settled } = await landed();
  console.log(
    `${test.info().project.name} | key press ${Math.round(key.at)} ms into the morph at height ${key.height.toFixed(1)}; ` +
      `state changed ${Math.round(flip.at - key.at)} ms later; at rest ${Math.round(settled.at - flip.at)} ms after that; ${frames.length} frames`,
  );

  // The press reached the button while the first morph was still running, after the surface had grown.
  expect(key.onButton).toBe(true);
  expect(key.running, `the key press reached the page ${Math.round(key.at)} ms into the 2000 ms morph`).toBe(true);
  expect(key.height).toBeGreaterThan(collapsed.height + 2);
  // It lands at once: nothing is waiting for the animation to end.
  expect(flip.at - key.at).toBeLessThanOrEqual(500);
  // It shrinks from the size it had reached; it does not jump to the full size first.
  const after = frames.filter((frame) => frame.at > flip.at);
  expect(Math.max(...after.map((frame) => frame.height))).toBeLessThanOrEqual(flip.height + 1);
  // On the way down it passes through the sizes in between, and it ends where it began.
  expect(after.some((frame) => frame.height < flip.height - 2 && frame.height > collapsed.height + 2)).toBe(true);
  expect(Math.round(settled.height)).toBe(Math.round(collapsed.height));
  expect(settled.at - flip.at, "from the press to rest, on the page's clock").toBeLessThanOrEqual(5000);
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
