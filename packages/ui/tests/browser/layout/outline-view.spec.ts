import { expect, test, type Page } from "@playwright/test";
import { openStory } from "../support";
import { computed, expectStoriesRenderClean, rect, resolved } from "./shared";

/**
 * `OutlineView`, and `Table` with a tree column, in a real engine: the things
 * jsdom cannot see.
 *
 * What this proves: each level indents by one step, on the leading side in
 * either direction; leaf rows line up with parent rows; the triangle points
 * inward when closed and down when open; a long title is cut and does not widen
 * the outline; the hierarchy of a several-column outline shows in its first
 * column only; and the accessibility tree a browser builds from the one-column
 * form.
 * What it does not prove: contrast of text (stories-axe.spec.ts,
 * contrast.test.ts), or how a screen reader speaks the tree.
 */

const ONE = "layout-outlineview--one-column";
const row = (page: Page, testId: string, name: string) => page.getByTestId(testId).getByRole("row", { name, exact: true });
const titleOf = (page: Page, testId: string, name: string) => row(page, testId, name).getByText(name, { exact: true });

test("every OutlineView story renders without a console message", async ({ page }) => {
  await expectStoriesRenderClean(page, "layout-outlineview--", ["playground", "one-column", "several-columns", "theme-states"], '[role="treegrid"]');
});

test("each level indents by one step, and leaf rows line up with parent rows", async ({ page }) => {
  await openStory(page, ONE, { appearance: "light" });
  const level1 = (await rect(titleOf(page, "expanded", "Read me"))).x;
  const level2 = (await rect(titleOf(page, "expanded", "Report"))).x;
  const level3 = (await rect(titleOf(page, "expanded", "Old notes"))).x;
  expect(level2 - level1).toBeCloseTo(16, 0);
  expect(level3 - level2).toBeCloseTo(16, 0);
  // "Documents" has a triangle and an icon; its triangle starts where a leaf row's spacer does.
  const triangle = await rect(row(page, "expanded", "Documents").getByRole("button"));
  const outline = await rect(page.getByTestId("expanded"));
  expect(triangle.x - outline.x).toBeCloseTo(8, 0);
  expect(level1).toBeGreaterThan(triangle.right);
});

test("the triangle points inward from the leading edge when closed and down when open", async ({ page }) => {
  await openStory(page, ONE, { appearance: "light" });
  const glyph = (testId: string) => row(page, testId, "Documents").getByRole("button").locator("svg");
  expect(await computed(glyph("collapsed"), "rotate")).toBe("none");
  expect(await computed(glyph("expanded"), "rotate")).toBe("90deg");

  await row(page, "collapsed", "Documents").getByRole("button").click();
  await expect(row(page, "collapsed", "Documents")).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => computed(glyph("collapsed"), "rotate")).toBe("90deg");

  await openStory(page, ONE, { appearance: "light", direction: "rtl" });
  expect(await computed(glyph("collapsed"), "scale")).toBe("-1 1");
  expect(await computed(glyph("expanded"), "rotate")).toBe("-90deg");
});

test("right to left indents from the other side", async ({ page }) => {
  await openStory(page, ONE, { appearance: "light", direction: "rtl" });
  const right = async (name: string) => (await rect(titleOf(page, "expanded", name))).right;
  expect((await right("Read me")) - (await right("Report"))).toBeCloseTo(16, 0);
  expect((await right("Report")) - (await right("Old notes"))).toBeCloseTo(16, 0);
});

test("a long title is cut and does not widen the outline", async ({ page }) => {
  await openStory(page, ONE, { appearance: "light" });
  const outline = page.getByTestId("expanded");
  const long = outline.getByText(/^Notes with a long name/);
  const overflow = await long.evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth }));
  expect(overflow.scroll).toBeGreaterThan(overflow.client);
  expect((await rect(long)).right).toBeLessThanOrEqual((await rect(outline)).right);
  expect(await outline.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test("a selected row takes the accent fill and a disabled one the tertiary label color", async ({ page }) => {
  await openStory(page, ONE, { appearance: "light" });
  const selected = row(page, "expanded", "Report");
  expect(await computed(selected, "background-color")).toBe(await resolved(selected, "background-color", "var(--accent-fill)"));
  const disabled = row(page, "collapsed", "Read me");
  expect(await computed(disabled, "color")).toBe(await resolved(disabled, "color", "var(--label-tertiary)"));
});

test("a several-column outline shows the hierarchy in its first column only", async ({ page }) => {
  await openStory(page, "layout-outlineview--several-columns", { appearance: "light" });
  const table = page.getByTestId("treegrid");
  const cells = (name: RegExp) => table.getByRole("row", { name });
  const nameX = async (name: RegExp, text: string) => (await rect(cells(name).getByText(text, { exact: true }))).x;
  const kindX = async (name: RegExp) => (await rect(cells(name).getByRole("gridcell").first())).x;

  // Level 2 is one step further in than level 1, in the first column.
  expect((await nameX(/Report$/, "Report")) - (await nameX(/Pictures$/, "Pictures"))).toBeCloseTo(16, 0);
  // The other columns do not move with the level.
  expect(await kindX(/Report$/)).toBeCloseTo(await kindX(/Pictures$/), 0);

  // Open a level-2 parent from its triangle: its child appears at level 3.
  await cells(/Archive$/).getByRole("button").click();
  await expect(cells(/Old notes$/)).toHaveAttribute("aria-level", "3");
  expect((await nameX(/Old notes$/, "Old notes")) - (await nameX(/Report$/, "Report"))).toBeCloseTo(16, 0);
});

test("the accessibility tree of the one-column form is a treegrid of rows with their levels", async ({ page }) => {
  await openStory(page, ONE, { appearance: "light" });
  await expect(page.getByTestId("collapsed")).toMatchAriaSnapshot(`
    - treegrid "Files, collapsed":
      - row "Documents" [level=1]:
        - gridcell:
          - button "Expand Documents"
      - row "Pictures" [level=1]:
        - gridcell:
          - button "Expand Pictures"
      - row "Read me" [disabled] [level=1]
  `);
});
