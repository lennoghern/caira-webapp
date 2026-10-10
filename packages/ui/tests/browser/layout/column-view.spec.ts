import { expect, test, type Page } from "@playwright/test";
import { openStory } from "../support";
import { computed, expectStoriesRenderClean, rect, resolved } from "./shared";

/**
 * `ColumnView` in a real engine: the things jsdom cannot see.
 *
 * What this proves: the columns sit side by side in the order of the path and
 * each scrolls on its own; a new column is brought into view without the page
 * scrolling; Right and Left move between columns, mirrored in right-to-left; a
 * real drag resizes one column; a long name is cut; and the accessibility tree
 * a browser builds from the group of listboxes (DECISIONS.md D-044).
 * What it does not prove: how a screen reader speaks that tree. No agent can
 * run one; that pass is pending.
 */

const STORY = "layout-columnview--path-and-preview";
const columns = (page: Page, testId: string) => page.getByTestId(testId).locator("[data-column-view-column]");
const option = (page: Page, testId: string, name: string) => page.getByTestId(testId).getByRole("option", { name, exact: true });

test("every ColumnView story renders without a console message", async ({ page }) => {
  await expectStoriesRenderClean(page, "layout-columnview--", ["playground", "path-and-preview", "theme-states"], "[data-column-view]");
});

test("the columns sit side by side in the order of the path, each as wide as it says", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const boxes = await columns(page, "deep").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON()));
  expect(boxes).toHaveLength(3);
  for (const [index, box] of boxes.entries()) {
    expect(box.width).toBeCloseTo(200, 0);
    if (index > 0) expect(box.x).toBeCloseTo(boxes[index - 1].x + 200, 0);
    expect(box.y).toBeCloseTo(boxes[0].y, 0);
  }
  // The preview of the selected file takes the place of a fourth column.
  const preview = await rect(page.getByTestId("deep").locator("[data-column-view-preview]"));
  expect(preview.x).toBeCloseTo(boxes[2].x + 200, 0);
  await expect(page.getByTestId("deep").getByRole("group", { name: "Old notes" })).toContainText("Document, 1 KB");
});

test("a selected item on the path keeps the highlight, and a long name is cut inside its column", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  for (const name of ["Documents", "Archive", "Old notes"]) {
    const item = option(page, "deep", name);
    expect(await computed(item, "background-color")).toBe(await resolved(item, "background-color", "var(--accent-fill)"));
  }
  const long = page.getByTestId("deep").getByText(/^Notes with a long name/);
  const overflow = await long.evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth }));
  expect(overflow.scroll).toBeGreaterThan(overflow.client);
  const column = await rect(columns(page, "deep").nth(2));
  expect((await rect(long)).right).toBeLessThanOrEqual(column.right);
});

test("Right moves into the next column and Left back to the parent, mirrored in right-to-left", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  await option(page, "empty", "Documents").focus();
  await page.keyboard.press("ArrowRight");
  // The item already selected in the next column.
  await expect(option(page, "empty", "Empty folder")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(option(page, "empty", "Archive")).toBeFocused();
  await expect(page.getByTestId("empty").getByRole("listbox", { name: "Archive" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(option(page, "empty", "Old notes")).toBeFocused();
  await expect(option(page, "empty", "Old notes")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(option(page, "empty", "Archive")).toBeFocused();
  await expect(option(page, "empty", "Old notes")).toHaveAttribute("aria-selected", "false");

  await openStory(page, STORY, { appearance: "light", direction: "rtl" });
  const boxes = await columns(page, "empty").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().x));
  expect(boxes[0]).toBeGreaterThan(boxes[1]!);
  await option(page, "empty", "Documents").focus();
  // Forward is to the left here.
  await page.keyboard.press("ArrowLeft");
  await expect(option(page, "empty", "Empty folder")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(option(page, "empty", "Documents")).toBeFocused();
});

test("a new column is brought into view, and only the view scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 560, height: 700 });
  await openStory(page, STORY, { appearance: "light" });
  const view = page.getByTestId("empty");
  const scroll = () => view.evaluate((element) => ({ left: element.scrollLeft, max: element.scrollWidth - element.clientWidth }));
  const pageScroll = () => page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  const before = await pageScroll();

  await view.evaluate((element) => (element.scrollLeft = 0));
  await option(page, "empty", "Archive").click();
  await expect(view.getByRole("listbox", { name: "Archive" })).toBeVisible();
  const after = await scroll();
  expect(after.max).toBeGreaterThan(0);
  expect(after.left).toBeCloseTo(after.max, 0);
  await expect(view.getByRole("listbox", { name: "Archive" })).toBeInViewport();
  expect(await pageScroll()).toEqual(before);
});

test("dragging the line after a column resizes that column only", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const handle = page.getByTestId("deep").getByRole("separator", { name: "Files" });
  const box = await rect(handle);
  expect(box.width).toBeCloseTo(1, 0);
  await page.mouse.move(box.x + 0.5, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 60.5, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(handle).toHaveAttribute("aria-valuenow", "260");
  expect((await rect(columns(page, "deep").nth(0))).width).toBeCloseTo(260, 0);
  expect((await rect(columns(page, "deep").nth(1))).width).toBeCloseTo(200, 0);
});

test("the accessibility tree is a group of listboxes named along the path", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  await expect(page.getByTestId("empty")).toMatchAriaSnapshot(`
    - group "Files, with an empty folder":
      - listbox "Files, with an empty folder":
        - option "Documents" [selected]
        - option "Pictures"
        - option "Read me"
      - separator "Files, with an empty folder"
      - listbox "Documents":
        - option "Report"
        - option "Archive"
        - option "Empty folder" [selected]
      - separator "Documents"
      - listbox "Empty folder":
        - option "No items"
      - separator "Empty folder"
  `);
  // What tells a parent item apart for assistive technology.
  await expect(option(page, "empty", "Documents")).toHaveAccessibleDescription("Has nested items");
  await expect(option(page, "empty", "Report")).toHaveAccessibleDescription("");
});
