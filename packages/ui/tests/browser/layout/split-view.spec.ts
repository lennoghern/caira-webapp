import { expect, test, type Locator, type Page } from "@playwright/test";
import { contrastRatio } from "../../../src/test/color";
import { openStory, samplePixels } from "../support";
import { computed, expectStoriesRenderClean, rect } from "./shared";

/**
 * `SplitView` in a real engine: the things jsdom cannot see.
 *
 * What this proves: the panes really take the sizes their dividers report and
 * the flexible pane takes the rest; a drag with a real pointer moves a divider
 * by the distance dragged, in the direction of its edge, mirrored in
 * right-to-left; the arrow keys follow the same directions; a collapsed pane
 * gives its space away and is out of the tab order; how wide a divider is and
 * how wide the strip that takes the pointer; and that forced colors leaves the
 * divider visible.
 * What it does not prove: anything by touch or pen, which share the pointer
 * events but were not driven here.
 */

const THREE = "layout-splitview--three-panes";
const OTHER = "layout-splitview--collapsing-and-stacking";
const divider = (page: Page, name: string) => page.getByRole("separator", { name, exact: true });

async function drag(page: Page, handle: Locator, dx: number, dy = 0) {
  const box = await rect(handle);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 4 });
  await page.mouse.up();
}

test("every SplitView story renders without a console message", async ({ page }) => {
  await expectStoriesRenderClean(
    page,
    "layout-splitview--",
    ["playground", "three-panes", "collapsing-and-stacking", "theme-states"],
    "[data-split-view]",
  );
});

test("the panes take the sizes their dividers report, and the flexible pane takes the rest", async ({ page }) => {
  await openStory(page, THREE, { appearance: "light" });
  const root = await rect(page.getByTestId("three"));
  const sidebar = await rect(page.getByTestId("sidebar"));
  const content = await rect(page.getByTestId("content"));
  const inspector = await rect(page.getByTestId("inspector"));
  expect(sidebar.width).toBeCloseTo(180, 0);
  expect(inspector.width).toBeCloseTo(200, 0);
  await expect(divider(page, "Sidebar")).toHaveAttribute("aria-valuenow", "180");
  await expect(divider(page, "Inspector")).toHaveAttribute("aria-valuenow", "200");
  // In reading order, with nothing left over: two panes, two 1 px dividers and the 1 px border on each side.
  expect(sidebar.x).toBeLessThan(content.x);
  expect(content.x).toBeLessThan(inspector.x);
  expect(sidebar.width + content.width + inspector.width + 2).toBeCloseTo(root.width - 2, 0);
  expect(sidebar.height).toBeCloseTo(root.height - 2, 0);
});

test("a drag moves a divider by the distance dragged, each in the direction of its edge", async ({ page }) => {
  await openStory(page, THREE, { appearance: "light" });
  await drag(page, divider(page, "Sidebar"), 40);
  await expect(divider(page, "Sidebar")).toHaveAttribute("aria-valuenow", "220");
  expect((await rect(page.getByTestId("sidebar"))).width).toBeCloseTo(220, 0);
  await expect(divider(page, "Sidebar")).toBeFocused();

  // The inspector's divider is on its leading edge: dragging toward the start grows it.
  await drag(page, divider(page, "Inspector"), -30);
  await expect(divider(page, "Inspector")).toHaveAttribute("aria-valuenow", "230");
  expect((await rect(page.getByTestId("inspector"))).width).toBeCloseTo(230, 0);

  // Past the limit it stops at the limit (maxSize 280).
  await drag(page, divider(page, "Sidebar"), 400);
  await expect(divider(page, "Sidebar")).toHaveAttribute("aria-valuenow", "280");
});

test("right to left mirrors the layout, the drag and the arrow keys", async ({ page }) => {
  await openStory(page, THREE, { appearance: "light", direction: "rtl" });
  expect((await rect(page.getByTestId("sidebar"))).x).toBeGreaterThan((await rect(page.getByTestId("inspector"))).x);
  // The sidebar is on the right now: dragging its divider to the left grows it.
  await drag(page, divider(page, "Sidebar"), -40);
  await expect(divider(page, "Sidebar")).toHaveAttribute("aria-valuenow", "220");
  // Left Arrow moves the divider left (APG Window Splitter), which grows this pane.
  await page.keyboard.press("ArrowLeft");
  await expect(divider(page, "Sidebar")).toHaveAttribute("aria-valuenow", "236");
  await page.keyboard.press("ArrowRight");
  await expect(divider(page, "Sidebar")).toHaveAttribute("aria-valuenow", "220");
});

test("the arrow keys move the divider and the pane follows", async ({ page }) => {
  await openStory(page, THREE, { appearance: "light" });
  await divider(page, "Sidebar").focus();
  await page.keyboard.press("ArrowRight");
  expect((await rect(page.getByTestId("sidebar"))).width).toBeCloseTo(196, 0);
  await page.keyboard.press("Home");
  expect((await rect(page.getByTestId("sidebar"))).width).toBeCloseTo(120, 0);
  await divider(page, "Inspector").focus();
  await page.keyboard.press("ArrowLeft");
  expect((await rect(page.getByTestId("inspector"))).width).toBeCloseTo(216, 0);
});

test("a collapsed pane gives its space to the others and leaves the tab order", async ({ page }) => {
  await openStory(page, OTHER, { appearance: "light" });
  const root = page.getByTestId("collapsible");
  const sidebar = page.getByTestId("collapsible-sidebar");
  const before = await rect(root.locator("[data-split-view-pane]").nth(1));
  await divider(page, "Sidebar").focus();
  await page.keyboard.press("Enter");
  await expect(sidebar).toBeHidden();
  await expect(divider(page, "Sidebar")).toHaveAttribute("aria-valuenow", "0");
  const after = await rect(root.locator("[data-split-view-pane]").nth(1));
  expect(after.width).toBeCloseTo(before.width + 240, 0);
  // The divider stays where a pointer and the keyboard can find it.
  await expect(divider(page, "Sidebar")).toBeVisible();
  await expect(divider(page, "Sidebar")).toBeFocused();

  // The button of the story says the same thing, and brings it back.
  const button = page.getByRole("button", { name: "Show sidebar" });
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await button.click();
  await expect(sidebar).toBeVisible();
  expect((await rect(sidebar)).width).toBeCloseTo(240, 0);
});

test("dragging a collapsible pane past half its minimum hides it, and a double click restores the default", async ({ page }) => {
  await openStory(page, OTHER, { appearance: "light" });
  const sidebar = page.getByTestId("collapsible-sidebar");
  await drag(page, divider(page, "Sidebar"), -200);
  await expect(sidebar).toBeHidden();
  await divider(page, "Sidebar").dblclick();
  await expect(sidebar).toBeVisible();
  expect((await rect(sidebar)).width).toBeCloseTo(240, 0);
});

test("stacked panes are divided by a horizontal bar that moves up and down", async ({ page }) => {
  await openStory(page, OTHER, { appearance: "light" });
  const top = page.getByTestId("stacked-top");
  const bar = divider(page, "Slide");
  expect((await rect(top)).height).toBeCloseTo(150, 0);
  await expect(bar).toHaveAttribute("aria-orientation", "horizontal");
  // The thick divider: 8 px, with a grip.
  expect((await rect(bar)).height).toBeCloseTo(8, 0);
  await expect(bar.locator("span")).toBeVisible();
  expect(await computed(bar, "cursor")).toBe("row-resize");

  await drag(page, bar, 0, 30);
  expect((await rect(top)).height).toBeCloseTo(180, 0);
  await page.keyboard.press("ArrowUp");
  expect((await rect(top)).height).toBeCloseTo(164, 0);
});

test("the thin divider is one pixel wide and takes the pointer on a wider strip", async ({ page }) => {
  await openStory(page, THREE, { appearance: "light" });
  const handle = divider(page, "Sidebar");
  const box = await rect(handle);
  expect(box.width).toBeCloseTo(1, 0);
  expect(await computed(handle, "cursor")).toBe("col-resize");
  expect(await computed(handle, "touch-action")).toBe("none");
  // 6 px to each side of the line belongs to the divider.
  const y = box.y + box.height / 2;
  const hit = (x: number) => page.evaluate(([px, py]) => document.elementFromPoint(px!, py!)?.getAttribute("role") ?? null, [x, y]);
  expect(await hit(box.x - 5)).toBe("separator");
  expect(await hit(box.x + 6)).toBe("separator");
  expect(await hit(box.x - 9)).not.toBe("separator");
  expect(await hit(box.x + 10)).not.toBe("separator");
});

test("forced colors leaves the divider visible against the panes", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openStory(page, OTHER, { appearance: "light" });
  const bar = divider(page, "Slide");
  // Off the grip, which sits in the middle.
  const line = await samplePixels(page, bar, { x: 0.2, y: 0.5 }, 2);
  const pane = await samplePixels(page, page.getByTestId("stacked-top"), { x: 0.2, y: 0.8 }, 2);
  expect(contrastRatio(line, pane)).toBeGreaterThanOrEqual(3);
});
