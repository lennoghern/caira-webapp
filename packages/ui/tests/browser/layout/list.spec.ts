import { expect, test, type Page } from "@playwright/test";
import { contrastRatio } from "../../../src/test/color";
import { openStory, samplePixels } from "../support";
import { computed, expectStoriesRenderClean, rect, resolved, TRANSPARENT } from "./shared";

/**
 * `List` in a real engine: the things jsdom cannot see.
 *
 * What this proves: the height of a row at each density, the frame of the
 * inset style, what a selected row paints (and that a label of another level
 * inside it follows), that hover feedback is emitted by the stylesheet and
 * withheld from a row with keyboard focus, the checkmark of an option list,
 * that a disabled row dims the labels inside it, mirroring in right-to-left,
 * and that forced colors paints a selected row with the system selection colors.
 * What it does not prove: contrast of text (stories-axe.spec.ts, contrast.test.ts).
 */

const STYLES = "layout-list--styles-and-selection";
const ROWS = "layout-list--sections-and-rows";
const row = (page: Page, testId: string, name: string) => page.getByTestId(testId).getByRole("row", { name, exact: true });

test("every List story renders without a console message", async ({ page }) => {
  await expectStoriesRenderClean(page, "layout-list--", ["playground", "styles-and-selection", "sections-and-rows", "theme-states"], '[role="grid"]');
});

test("a row is as tall as the control height of the density", async ({ page }) => {
  await openStory(page, STYLES, { appearance: "light" });
  expect((await rect(row(page, "plain", "Inbox"))).height).toBeCloseTo(28, 0);
  await openStory(page, STYLES, { appearance: "light", platform: "ios" });
  expect((await rect(row(page, "plain", "Inbox"))).height).toBeCloseTo(44, 0);
});

for (const appearance of ["light", "dark"] as const) {
  test(`a selected row takes the accent fill and semibold, and the labels inside it follow: ${appearance}`, async ({ page }) => {
    await openStory(page, STYLES, { appearance });
    const selected = row(page, "plain", "Drafts");
    const fill = await resolved(selected, "background-color", "var(--accent-fill)");
    expect(await computed(selected, "background-color")).toBe(fill);
    expect(await computed(selected, "font-weight")).toBe("600");
    expect(await computed(row(page, "plain", "Inbox"), "background-color")).toBe(TRANSPARENT);
    expect(await computed(row(page, "plain", "Inbox"), "font-weight")).toBe("400");

    // A secondary label inside a selected row reads in the on-accent color, not in its gray.
    await openStory(page, "layout-list--theme-states", { appearance });
    const cell = page.locator('[data-matrix-cell="light, regular glass"]');
    const inSelected = cell.getByRole("row", { name: "Drafts" }).locator('[data-label].text-label-secondary');
    const inOther = cell.getByRole("row", { name: "Inbox" }).locator('[data-label].text-label-secondary');
    expect(await computed(inSelected, "color")).toBe(await resolved(cell, "color", "var(--on-accent)"));
    expect(await computed(inOther, "color")).toBe(await resolved(cell, "color", "var(--label-secondary)"));
  });
}

test("the inset style frames the list on the secondary background", async ({ page }) => {
  await openStory(page, STYLES, { appearance: "light" });
  const inset = page.getByTestId("inset");
  expect(await computed(inset, "background-color")).toBe(await resolved(inset, "background-color", "var(--background-secondary)"));
  expect(await computed(inset, "border-top-width")).toBe("1px");
  expect(await computed(inset, "border-top-left-radius")).toBe(await resolved(inset, "border-top-left-radius", "var(--radius-box)"));
  expect(await computed(page.getByTestId("plain"), "background-color")).toBe(TRANSPARENT);
});

test("a row shows feedback under the pointer, but not while it has keyboard focus", async ({ page }) => {
  await openStory(page, STYLES, { appearance: "light" });
  const target = row(page, "plain", "Sent");
  const hoverFill = await resolved(target, "background-color", "var(--fill-quaternary)");
  await target.hover();
  await expect(target).toHaveAttribute("data-hovered", "true");
  expect(await computed(target, "background-color")).toBe(hoverFill);

  // Reach the same row with the keyboard while the pointer rests on it.
  await row(page, "plain", "Drafts").focus();
  await page.keyboard.press("ArrowDown");
  await expect(target).toBeFocused();
  await expect(target).toHaveAttribute("data-focus-visible", "true");
  await expect(target).toHaveAttribute("data-hovered", "true");
  // The accent ring would fall under 3:1 on the hover fill (src/layout/contrast.test.ts).
  expect(await computed(target, "background-color")).toBe(TRANSPARENT);
  expect(await computed(target, "outline-style")).toBe("solid");
  expect(await computed(target, "outline-offset")).toBe("-2px");
});

test("an option list shows its checkmark in selected rows only, and no highlight", async ({ page }) => {
  await openStory(page, STYLES, { appearance: "light" });
  const mark = (name: string) => row(page, "checkmark", name).locator('[data-icon="checkmark"]');
  expect(await computed(mark("Inbox"), "opacity")).toBe("1");
  expect(await computed(mark("Drafts"), "opacity")).toBe("0");
  expect(await computed(row(page, "checkmark", "Inbox"), "background-color")).toBe(TRANSPARENT);
  // At the trailing edge.
  const rowBox = await rect(row(page, "checkmark", "Inbox"));
  expect((await rect(mark("Inbox"))).x).toBeGreaterThan(rowBox.x + rowBox.width * 0.8);
});

test("a disabled row dims the labels and icons inside it", async ({ page }) => {
  await openStory(page, ROWS, { appearance: "light" });
  const disabled = row(page, "sections", "VPN");
  const tertiary = await resolved(disabled, "color", "var(--label-tertiary)");
  expect(await computed(disabled.locator("[data-label]"), "color")).toBe(tertiary);
  expect(await computed(row(page, "sections", "Wi-Fi").locator("[data-label]").first(), "color")).not.toBe(tertiary);
});

test("right to left moves the disclosure indicator to the other edge and mirrors it", async ({ page }) => {
  await openStory(page, ROWS, { appearance: "light" });
  const target = row(page, "sections", "Wi-Fi");
  const indicator = target.locator('[data-icon="chevron-forward"]');
  expect((await rect(indicator)).x).toBeGreaterThan((await rect(target)).x + (await rect(target)).width / 2);
  await openStory(page, ROWS, { appearance: "light", direction: "rtl" });
  expect((await rect(indicator)).x).toBeLessThan((await rect(target)).x + (await rect(target)).width / 2);
  expect(await computed(indicator, "scale")).toBe("-1 1");
});

test("forced colors paints a selected row with the system selection colors", async ({ page }, testInfo) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openStory(page, STYLES, { appearance: "light" });
  const selectedRow = row(page, "plain", "Drafts");
  expect(await computed(selectedRow, "background-color")).toBe(await resolved(selectedRow, "background-color", "Highlight"));
  expect(await computed(selectedRow, "color")).toBe(await resolved(selectedRow, "color", "HighlightText"));
  // Under forced colors the library hands the selection to the system: its Highlight and
  // HighlightText. How far those are from the Canvas is the person's theme, not ours: the palette
  // Chromium emulates gives well over 3:1, the one Firefox emulates 2.94:1 (measured), so no ratio
  // is asserted here, only that a selected row is painted differently. The figure is printed.
  // The trailing end of each row, clear of its text.
  const selected = await samplePixels(page, selectedRow, { x: 0.9, y: 0.5 }, 2);
  const other = await samplePixels(page, row(page, "plain", "Inbox"), { x: 0.9, y: 0.5 }, 2);
  console.log(`forced colors | ${testInfo.project.name} | list: selected row against the others ${contrastRatio(selected, other).toFixed(2)}:1`);
  expect(contrastRatio(selected, other)).toBeGreaterThan(1);
});
