import { expect, test } from "@playwright/test";
import { contrastRatio } from "../../../src/test/color";
import { openStory, samplePixels } from "../support";
import { computed, expectStoriesRenderClean, rect, resolved } from "./shared";

/**
 * `Tabs` in a real engine: the things jsdom cannot see.
 *
 * What this proves: where the tabbed control sits, that the selected tab is
 * painted with the accent fill and set in semibold without changing its width,
 * that the hover feedback is really emitted by the stylesheet, which ring a
 * focused tab shows and where, mirroring in right-to-left, and that forced
 * colors paints the selected tab with the system selection colors.
 * What it does not prove: the slide of the indicator between two tabs, which is
 * not measured here; contrast of text (stories-axe.spec.ts, contrast.test.ts).
 */

test("every Tabs story renders without a console message", async ({ page }) => {
  await expectStoriesRenderClean(page, "layout-tabs--", ["playground", "orientations", "states", "theme-states"], '[role="tablist"]');
});

test("the control sits on the top edge of the pane, centered; when vertical, on its leading side", async ({ page }) => {
  await openStory(page, "layout-tabs--orientations", { appearance: "light" });
  const horizontal = page.getByTestId("horizontal");
  const list = await rect(horizontal.getByRole("tablist"));
  const panel = await rect(horizontal.getByRole("tabpanel"));
  expect(list.bottom).toBeLessThanOrEqual(panel.y);
  expect(list.x + list.width / 2).toBeCloseTo(panel.x + panel.width / 2, 0);

  const vertical = page.getByTestId("vertical");
  const sideList = await rect(vertical.getByRole("tablist"));
  const sidePanel = await rect(vertical.getByRole("tabpanel"));
  expect(sideList.right).toBeLessThanOrEqual(sidePanel.x);
  expect(sideList.y).toBeCloseTo(sidePanel.y, 0);

  await openStory(page, "layout-tabs--orientations", { appearance: "light", direction: "rtl" });
  const tabs = horizontal.getByRole("tab");
  expect((await rect(tabs.first())).x).toBeGreaterThan((await rect(tabs.last())).x);
  expect((await rect(vertical.getByRole("tablist"))).x).toBeGreaterThanOrEqual((await rect(vertical.getByRole("tabpanel"))).right);
});

for (const appearance of ["light", "dark"] as const) {
  test(`the selected tab takes the accent fill, the on-accent color and semibold: ${appearance}`, async ({ page }) => {
    await openStory(page, "layout-tabs--orientations", { appearance });
    const selected = page.getByTestId("horizontal").getByRole("tab", { name: "Display" });
    const other = page.getByTestId("horizontal").getByRole("tab", { name: "Color" });
    const indicator = selected.locator("> div").first();
    expect(await computed(indicator, "background-color")).toBe(await resolved(selected, "background-color", "var(--accent-fill)"));
    expect(await computed(selected, "color")).toBe(await resolved(selected, "color", "var(--on-accent)"));
    expect(await computed(selected, "font-weight")).toBe("600");
    expect(await computed(other, "font-weight")).toBe("400");
    expect(await computed(other, "color")).toBe(await resolved(other, "color", "var(--label)"));
    await expect(other.locator("> div")).toHaveCount(0);
  });
}

test("selecting a tab does not change its width or move its neighbors", async ({ page }) => {
  await openStory(page, "layout-tabs--orientations", { appearance: "light" });
  const tabs = page.getByTestId("horizontal").getByRole("tab");
  const widths = () => tabs.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  const before = await widths();
  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  expect(await widths()).toEqual(before);
});

test("an unselected tab shows feedback under the pointer", async ({ page }) => {
  await openStory(page, "layout-tabs--orientations", { appearance: "light" });
  const tab = page.getByTestId("horizontal").getByRole("tab", { name: "Color" });
  expect(await computed(tab, "background-color")).toBe("rgba(0, 0, 0, 0)");
  await tab.hover();
  await expect(tab).toHaveAttribute("data-hovered", "true");
  expect(await computed(tab, "background-color")).toBe(await resolved(tab, "background-color", "var(--fill-quaternary)"));
});

test("the focus ring is drawn inside the tab: on-accent on the selected one, the label color on the others", async ({ page }) => {
  await openStory(page, "layout-tabs--states", { appearance: "light" });
  const manual = page.getByTestId("manual");
  await manual.getByRole("tab", { name: "Night Shift" }).focus();
  // Arrow keys make the focus a keyboard focus.
  await page.keyboard.press("ArrowLeft");
  const unselected = manual.getByRole("tab", { name: "Color" });
  await expect(unselected).toBeFocused();
  await expect(unselected).toHaveAttribute("aria-selected", "false");
  expect(await computed(unselected, "outline-offset")).toBe("-2px");
  expect(await computed(unselected, "outline-style")).toBe("solid");
  expect(await computed(unselected, "outline-color")).toBe(await resolved(unselected, "color", "var(--label)"));

  await page.keyboard.press("ArrowRight");
  const selected = manual.getByRole("tab", { name: "Night Shift" });
  await expect(selected).toBeFocused();
  expect(await computed(selected, "outline-color")).toBe(await resolved(selected, "color", "var(--on-accent)"));
});

test("the indicator does not animate under reduced motion", async ({ page }) => {
  await openStory(page, "layout-tabs--orientations", { appearance: "light", motion: "reduced" });
  const indicator = page.getByTestId("horizontal").getByRole("tab", { name: "Display" }).locator("> div").first();
  expect(await computed(indicator, "transition-property")).toBe("none");
});

test("forced colors paints the selected tab with the system selection colors", async ({ page }, testInfo) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openStory(page, "layout-tabs--orientations", { appearance: "light" });
  const tabs = page.getByTestId("horizontal").getByRole("tab");
  const indicator = tabs.nth(0).locator("> div").first();
  expect(await computed(indicator, "background-color")).toBe(await resolved(tabs.nth(0), "background-color", "Highlight"));
  expect(await computed(tabs.nth(0), "color")).toBe(await resolved(tabs.nth(0), "color", "HighlightText"));
  // Under forced colors the library hands the selection to the system: its Highlight and
  // HighlightText. How far those are from the Canvas is the person's theme, not ours: the palette
  // Chromium emulates gives well over 3:1, the one Firefox emulates 2.94:1 (measured), so no ratio
  // is asserted here, only that the selected tab is painted differently. The figure is printed.
  // A corner of each tab, clear of its text.
  const selected = await samplePixels(page, tabs.nth(0), { x: 0.08, y: 0.5 }, 2);
  const other = await samplePixels(page, tabs.nth(1), { x: 0.08, y: 0.5 }, 2);
  console.log(`forced colors | ${testInfo.project.name} | tabs: selected tab against the others ${contrastRatio(selected, other).toFixed(2)}:1`);
  expect(contrastRatio(selected, other)).toBeGreaterThan(1);
});
