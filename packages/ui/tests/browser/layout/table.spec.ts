import { expect, test, type Page } from "@playwright/test";
import { contrastRatio } from "../../../src/test/color";
import { openStory, samplePixels } from "../support";
import { computed, expectStoriesRenderClean, rect, resolved, TRANSPARENT } from "./shared";

/**
 * `Table` in a real engine: the things jsdom cannot see.
 *
 * What this proves: the height of a row at each density, the stripe, what a
 * selected row paints, which heading shows the sort mark and which way it
 * points, that a real drag on a resizer changes the width of its column, and
 * that forced colors paints a selected row with the system selection colors. The tree column is covered in
 * outline-view.spec.ts.
 * What it does not prove: contrast of text (stories-axe.spec.ts, contrast.test.ts).
 */

const STORY = "layout-table--sorting-and-stripes";
const row = (page: Page, name: string) => page.getByTestId("striped").getByRole("row", { name, exact: true });
const heading = (page: Page, name: string) => page.getByTestId("striped").getByRole("columnheader", { name, exact: true });

test("every Table story renders without a console message", async ({ page }) => {
  await expectStoriesRenderClean(page, "layout-table--", ["playground", "sorting-and-stripes", "resizable-columns", "theme-states"], '[role="grid"]');
});

test("a row is as tall as the control height of the density, and the headings sit above it", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  expect((await rect(row(page, "Budget"))).height).toBeCloseTo(28, 0);
  expect((await rect(heading(page, "Name"))).bottom).toBeLessThanOrEqual((await rect(row(page, "Budget"))).y + 0.5);
  await openStory(page, STORY, { appearance: "light", platform: "ios" });
  expect((await rect(row(page, "Budget"))).height).toBeCloseTo(44, 0);
});

for (const appearance of ["light", "dark"] as const) {
  test(`every other row is striped, and a selected row takes the accent fill instead: ${appearance}`, async ({ page }) => {
    await openStory(page, STORY, { appearance });
    // Sorted by name: Budget, Notes, Photo (selected), Report.
    const stripe = await resolved(row(page, "Budget"), "background-color", "var(--fill-quaternary)");
    expect(await computed(row(page, "Budget"), "background-color")).toBe(TRANSPARENT);
    expect(await computed(row(page, "Notes"), "background-color")).toBe(stripe);
    expect(await computed(row(page, "Report"), "background-color")).toBe(stripe);
    const selected = row(page, "Photo");
    expect(await computed(selected, "background-color")).toBe(await resolved(selected, "background-color", "var(--accent-fill)"));
    expect(await computed(selected, "font-weight")).toBe("600");
    expect(await computed(selected.getByRole("gridcell").first(), "color")).toBe(await resolved(selected, "color", "var(--on-accent)"));
  });
}

test("the sort mark shows in the sorted heading only and turns over when the order is reversed", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const mark = (name: string) => heading(page, name).locator('[data-icon="chevron-up"]');
  await expect(heading(page, "Name")).toHaveAttribute("aria-sort", "ascending");
  expect(await computed(mark("Name"), "visibility")).toBe("visible");
  expect(await computed(mark("Name"), "rotate")).toBe("none");
  expect(await computed(mark("Size"), "visibility")).toBe("hidden");

  await heading(page, "Name").click();
  await expect(heading(page, "Name")).toHaveAttribute("aria-sort", "descending");
  await expect.poll(() => computed(mark("Name"), "rotate")).toBe("180deg");
  // The rows follow: Report first now.
  await expect(page.getByTestId("striped").getByRole("row").nth(1)).toHaveAccessibleName("Report");

  await heading(page, "Size").click();
  expect(await computed(mark("Size"), "visibility")).toBe("visible");
  expect(await computed(mark("Name"), "visibility")).toBe("hidden");
});

test("dragging the resizer of a heading changes the width of its column", async ({ page }) => {
  await openStory(page, "layout-table--resizable-columns", { appearance: "light" });
  const name = page.getByTestId("resizable").getByRole("columnheader").first();
  const kind = page.getByTestId("resizable").getByRole("columnheader").nth(1);
  const before = { name: (await rect(name)).width, kind: (await rect(kind)).x };
  const handle = await rect(name.locator('[role="presentation"]'));
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 60, handle.y + handle.height / 2, { steps: 4 });
  await page.mouse.up();
  expect((await rect(name)).width).toBeCloseTo(before.name + 60, -1);
  expect((await rect(kind)).x).toBeCloseTo(before.kind + 60, -1);
  // The table still fits its container: resizing never makes the page scroll sideways.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("forced colors paints a selected row with the system selection colors", async ({ page }, testInfo) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openStory(page, STORY, { appearance: "light" });
  const selectedRow = row(page, "Photo");
  expect(await computed(selectedRow, "background-color")).toBe(await resolved(selectedRow, "background-color", "Highlight"));
  expect(await computed(selectedRow.getByRole("gridcell").first(), "color")).toBe(await resolved(selectedRow, "color", "HighlightText"));
  // Under forced colors the library hands the selection to the system: its Highlight and
  // HighlightText. How far those are from the Canvas is the person's theme, not ours: the palette
  // Chromium emulates gives well over 3:1, the one Firefox emulates 2.94:1 (measured), so no ratio
  // is asserted here, only that a selected row is painted differently. The figure is printed.
  const selected = await samplePixels(page, selectedRow, { x: 0.95, y: 0.5 }, 2);
  const other = await samplePixels(page, row(page, "Budget"), { x: 0.95, y: 0.5 }, 2);
  console.log(`forced colors | ${testInfo.project.name} | table: selected row against the others ${contrastRatio(selected, other).toFixed(2)}:1`);
  expect(contrastRatio(selected, other)).toBeGreaterThan(1);
});

test("right to left starts the columns from the other side and keeps the text at the leading edge", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light", direction: "rtl" });
  expect((await rect(heading(page, "Name"))).x).toBeGreaterThan((await rect(heading(page, "Size"))).x);
  expect(await computed(heading(page, "Name"), "text-align")).toBe("start");
  // The sort mark sits at the trailing end of its heading, which is the left here.
  const mark = await rect(heading(page, "Name").locator('[data-icon="chevron-up"]'));
  const cell = await rect(heading(page, "Name"));
  expect(mark.x).toBeLessThan(cell.x + cell.width / 2);
});
