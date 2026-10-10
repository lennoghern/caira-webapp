import { expect, test } from "@playwright/test";
import { openStory } from "../support";
import { computed, expectStoriesRenderClean, rect, resolved } from "./shared";

/**
 * `Label` in a real engine: the things jsdom cannot see.
 *
 * What this proves: the three levels paint the three label tokens, the text
 * styles take the size of the density, a line limit cuts the title and not the
 * icon, an icon-only label keeps its icon and hides its text from sight, the
 * icon moves and mirrors in right-to-left, and `selectable` wins over a
 * container that turns selection off.
 * What it does not prove: contrast, which axe measures on these opaque
 * backgrounds in stories-axe.spec.ts and contrast.test.ts computes.
 */

test("every Label story renders without a console message", async ({ page }) => {
  await expectStoriesRenderClean(page, "layout-label--", ["playground", "levels-and-text-styles", "icon-and-truncation", "theme-states"], "[data-label]");
});

for (const appearance of ["light", "dark"] as const) {
  test(`the three levels paint the three label colors: ${appearance}`, async ({ page }) => {
    await openStory(page, "layout-label--levels-and-text-styles", { appearance });
    const labels = page.getByTestId("levels").locator("[data-label]");
    const colors = await labels.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).color));
    expect(new Set(colors).size).toBe(3);
    for (const [index, token] of ["--label", "--label-secondary", "--label-tertiary"].entries()) {
      expect(colors[index]).toBe(await resolved(labels.nth(index), "color", `var(${token})`));
    }
  });
}

test("text styles take the sizes of the density", async ({ page }) => {
  const sizeOf = (style: string) => computed(page.locator(`[data-text-style="${style}"]`), "font-size");
  await openStory(page, "layout-label--levels-and-text-styles", { appearance: "light" });
  // VERIFIED values in tokens.css: the macOS built-in text styles.
  expect(await sizeOf("body")).toBe("13px");
  expect(await sizeOf("large-title")).toBe("26px");
  expect(await sizeOf("footnote")).toBe("10px");
  await openStory(page, "layout-label--levels-and-text-styles", { appearance: "light", platform: "ios" });
  // The iOS "Large (default)" Dynamic Type row.
  expect(await sizeOf("body")).toBe("17px");
  expect(await sizeOf("large-title")).toBe("34px");
});

test("a line limit cuts the title and leaves the icon whole", async ({ page }) => {
  await openStory(page, "layout-label--icon-and-truncation", { appearance: "light" });
  const container = await rect(page.getByTestId("limits"));

  const one = page.getByTestId("one-line");
  const title = one.locator("[data-label-title]");
  const overflow = await title.evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth }));
  expect(overflow.scroll).toBeGreaterThan(overflow.client);
  expect((await rect(one)).right).toBeLessThanOrEqual(container.right + 0.5);
  const lineHeight = Number.parseFloat(await computed(title, "line-height"));
  expect((await rect(title)).height).toBeLessThanOrEqual(lineHeight + 1);
  // The icon follows the text size (1.25em of 13px) and did not shrink.
  expect((await rect(one.locator("svg"))).width).toBeCloseTo(16.25, 0);

  const two = page.getByTestId("two-lines").locator("[data-label-title]");
  const twoHeight = (await rect(two)).height;
  expect(twoHeight).toBeGreaterThan(lineHeight + 1);
  expect(twoHeight).toBeLessThanOrEqual(lineHeight * 2 + 1);
});

test("an icon-only label shows its icon and hides its text from sight only", async ({ page }) => {
  await openStory(page, "layout-label--icon-and-truncation", { appearance: "light" });
  const label = page.locator('[data-label-style="icon-only"]');
  await expect(label.locator("svg")).toBeVisible();
  const title = await rect(label.locator("[data-label-title]"));
  expect(title.width).toBeLessThanOrEqual(1);
  expect(title.height).toBeLessThanOrEqual(1);
  // Still in the accessibility tree.
  await expect(page.getByText("Icon only", { exact: true })).toBeAttached();
});

test("right to left puts the icon after the text on screen and mirrors a directional icon", async ({ page }) => {
  await openStory(page, "layout-label--icon-and-truncation", { appearance: "light" });
  const label = page.getByTestId("styles").locator("[data-label]").last();
  const ltr = { icon: await rect(label.locator("[data-label-icon]")), title: await rect(label.locator("[data-label-title]")) };
  expect(ltr.icon.right).toBeLessThanOrEqual(ltr.title.x);
  expect(await computed(label.locator("svg"), "scale")).toBe("none");

  await openStory(page, "layout-label--icon-and-truncation", { appearance: "light", direction: "rtl" });
  const rtl = { icon: await rect(label.locator("[data-label-icon]")), title: await rect(label.locator("[data-label-title]")) };
  expect(rtl.icon.x).toBeGreaterThanOrEqual(rtl.title.right);
  expect(await computed(label.locator("svg"), "scale")).toBe("-1 1");
});

test("a selectable label can be selected inside a container that turns selection off", async ({ page }) => {
  await openStory(page, "layout-label--icon-and-truncation", { appearance: "light" });
  expect(await computed(page.getByTestId("limits"), "user-select")).toBe("none");
  expect(await computed(page.getByTestId("selectable"), "user-select")).toBe("text");
});
