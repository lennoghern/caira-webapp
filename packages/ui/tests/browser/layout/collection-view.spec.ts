import { expect, test, type Page } from "@playwright/test";
import { contrastRatio } from "../../../src/test/color";
import { openStory, samplePixels } from "../support";
import { computed, expectStoriesRenderClean, rect, resolved } from "./shared";

/**
 * `CollectionView` in a real engine: the things jsdom cannot see.
 *
 * What this proves: the grid wraps into rows and columns and the four arrow
 * keys move to the item in that direction as drawn (React Aria reads the
 * positions, which jsdom does not have); the row is one line that scrolls and
 * brings the focused item into view; the three item sizes; the highlight around
 * a selected item; the mirrored layout in right-to-left (not the arrow keys:
 * see the note on that test); and that forced colors paints a selected item with the system
 * selection colors.
 * What it does not prove: contrast of text (stories-axe.spec.ts, contrast.test.ts).
 */

const STORY = "layout-collectionview--grid-and-row";
const item = (page: Page, testId: string, name: string) => page.getByTestId(testId).getByRole("row", { name, exact: true });
const positions = (page: Page, testId: string) =>
  page
    .getByTestId(testId)
    .getByRole("row")
    .evaluateAll((elements) => elements.map((element) => ({ name: element.getAttribute("aria-label"), x: Math.round(element.getBoundingClientRect().x), y: Math.round(element.getBoundingClientRect().y) })));

test("every CollectionView story renders without a console message", async ({ page }) => {
  await expectStoriesRenderClean(
    page,
    "layout-collectionview--",
    ["playground", "grid-and-row", "sizes-and-empty", "theme-states"],
    '[role="grid"]',
  );
});

test("the grid wraps into lines, and the four arrow keys move to the item drawn in that direction", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const grid = await positions(page, "grid");
  expect(grid).toHaveLength(8);
  const perLine = grid.filter((entry) => entry.y === grid[0]!.y).length;
  expect(perLine).toBeGreaterThan(1);
  expect(perLine).toBeLessThan(8);
  // Columns line up from one line to the next.
  expect(grid[perLine]!.x).toBe(grid[0]!.x);
  expect(grid[perLine]!.y).toBeGreaterThan(grid[0]!.y);

  await item(page, "grid", "Beach").focus();
  await page.keyboard.press("ArrowRight");
  await expect(item(page, "grid", "Forest")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByTestId("grid").getByRole("row").nth(1 + perLine)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("grid").getByRole("row").nth(perLine)).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(item(page, "grid", "Beach")).toBeFocused();
});

test("the row is one line that scrolls, and the arrow keys bring the next item into view", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const row = page.getByTestId("row");
  const line = await positions(page, "row");
  expect(new Set(line.map((entry) => entry.y)).size).toBe(1);
  expect(await row.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await item(page, "row", "Beach").focus();
  for (let step = 0; step < 7; step += 1) await page.keyboard.press("ArrowRight");
  await expect(item(page, "row", "Harbor")).toBeFocused();
  await expect(item(page, "row", "Harbor")).toBeInViewport({ ratio: 0.9 });
  expect(await row.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test("the three item sizes set the least width of an item", async ({ page }) => {
  await openStory(page, "layout-collectionview--sizes-and-empty", { appearance: "light" });
  const width = async (testId: string) => (await rect(page.getByTestId(testId).getByRole("row").first())).width;
  // 6rem and 12rem at the least; the grid shares out what is left over.
  expect(await width("small")).toBeGreaterThanOrEqual(96);
  expect(await width("large")).toBeGreaterThanOrEqual(192);
  expect(await width("large")).toBeGreaterThan(await width("small"));
  await expect(page.getByTestId("empty")).toContainText("No albums");
});

test("a selected item is highlighted around its image, a disabled one dims, and hover shows", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const selected = item(page, "grid", "Forest");
  expect(await computed(selected, "background-color")).toBe(await resolved(selected, "background-color", "var(--accent-fill)"));
  expect(await computed(selected, "padding-top")).toBe("8px");
  expect(await computed(selected, "font-weight")).toBe("600");
  const disabled = item(page, "grid", "Harbor");
  expect(await computed(disabled, "color")).toBe(await resolved(disabled, "color", "var(--label-tertiary)"));
  const other = item(page, "grid", "Beach");
  await other.hover();
  await expect(other).toHaveAttribute("data-hovered", "true");
  expect(await computed(other, "background-color")).toBe(await resolved(other, "background-color", "var(--fill-quaternary)"));
});

// Not asserted: mirrored arrow keys. React Aria takes the direction of its keyboard navigation from
// its locale (I18nProvider), not from the `dir` attribute, and the playground only sets `dir`. With
// an English locale and dir="rtl", Left still moves to the previous item (observed). PROGRESS.md.
test("right to left starts the grid from the other side", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light", direction: "rtl" });
  const grid = await positions(page, "grid");
  expect(grid[0]!.x).toBeGreaterThan(grid[1]!.x);
  const line = await positions(page, "row");
  expect(line[0]!.x).toBeGreaterThan(line[1]!.x);
});

test("forced colors paints a selected item with the system selection colors", async ({ page }, testInfo) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openStory(page, STORY, { appearance: "light" });
  const selectedItem = item(page, "grid", "Forest");
  expect(await computed(selectedItem, "background-color")).toBe(await resolved(selectedItem, "background-color", "Highlight"));
  expect(await computed(selectedItem, "color")).toBe(await resolved(selectedItem, "color", "HighlightText"));
  // Under forced colors the library hands the selection to the system: its Highlight and
  // HighlightText. How far those are from the Canvas is the person's theme, not ours: the palette
  // Chromium emulates gives well over 3:1, the one Firefox emulates 2.94:1 (measured), so no ratio
  // is asserted here, only that a selected item is painted differently. The figure is printed.
  // The padding at the top of each item, above its image.
  const selected = await samplePixels(page, selectedItem, { x: 0.5, y: 0.02 }, 2);
  const other = await samplePixels(page, item(page, "grid", "Beach"), { x: 0.5, y: 0.02 }, 2);
  console.log(`forced colors | ${testInfo.project.name} | collection: selected item against the others ${contrastRatio(selected, other).toFixed(2)}:1`);
  expect(contrastRatio(selected, other)).toBeGreaterThan(1);
});
