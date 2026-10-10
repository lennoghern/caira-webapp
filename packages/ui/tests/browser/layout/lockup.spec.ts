import { expect, test } from "@playwright/test";
import { openStory } from "../support";
import { computed, expectStoriesRenderClean, rect, resolved } from "./shared";

/**
 * `Lockup` in a real engine: the things jsdom cannot see.
 *
 * What this proves: the shape of each type (the frame of a card, the circle of
 * a monogram, the caption of a poster over its image); that the whole lockup
 * grows under the pointer and with keyboard focus and stays its size under
 * reduced motion; that a poster's caption appears on hover and on focus; the
 * names a browser computes for the lockups; and the order header, content,
 * footer on screen.
 * What it does not prove: text on the poster's caption, which sits on a
 * material and is left to the pixel tests of the materials themselves; tvOS
 * behavior, of which this is a web analogue.
 */

const STORY = "layout-lockup--types";

test("every Lockup story renders without a console message", async ({ page }) => {
  await expectStoriesRenderClean(page, "layout-lockup--", ["playground", "types", "row", "theme-states"], "[data-lockup]");
});

test("each lockup is one control, named by its header, title and subtitle", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  await expect(page.getByTestId("card")).toHaveAccessibleName("Review A fine film 4 of 5");
  await expect(page.getByTestId("card")).toHaveRole("button");
  await expect(page.getByTestId("caption")).toHaveRole("link");
  await expect(page.getByTestId("caption")).toHaveAccessibleName("The Long Road A link");
  // Initials are decoration: the name is the person's.
  await expect(page.getByTestId("monogram")).toHaveAccessibleName("Ada Lovelace");
  // A poster's caption is not on screen yet, and still names it.
  await expect(page.getByTestId("poster")).toHaveAccessibleName("Night Sky 2025");
  await expect(page.getByTestId("disabled")).toBeDisabled();
});

test("a card is framed, with header, content and footer from top to bottom", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const card = page.getByTestId("card");
  expect(await computed(card, "border-top-width")).toBe("1px");
  expect(await computed(card, "background-color")).toBe(await resolved(card, "background-color", "var(--background-secondary)"));
  const [header, content, footer] = await Promise.all(
    ["header", "content", "footer"].map((part) => rect(card.locator(`[data-lockup-${part}]`))),
  );
  expect(header!.bottom).toBeLessThanOrEqual(content!.y);
  expect(content!.bottom).toBeLessThanOrEqual(footer!.y);
  expect(footer!.bottom).toBeLessThanOrEqual((await rect(card)).bottom);
});

test("a monogram is a circle, with initials or a picture, and the name under it", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  for (const testId of ["monogram", "monogram-picture"]) {
    const content = page.getByTestId(testId).locator("[data-lockup-content]");
    const box = await rect(content);
    expect(box.width).toBeCloseTo(box.height, 0);
    expect(Number.parseFloat(await computed(content, "border-top-left-radius"))).toBeGreaterThanOrEqual(box.width / 2);
    expect((await rect(page.getByTestId(testId).locator("[data-lockup-footer]"))).y).toBeGreaterThanOrEqual(box.bottom);
  }
  await expect(page.getByTestId("monogram").getByText("AL")).toBeVisible();
  await expect(page.getByTestId("monogram-picture").getByText("GH")).toHaveCount(0);
});

test("a poster shows its title and subtitle over the image on hover and on keyboard focus", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const poster = page.getByTestId("poster");
  const caption = poster.locator("[data-lockup-footer]");
  expect(await computed(caption, "opacity")).toBe("0");
  // Over the bottom of the image, not under it.
  const content = await rect(poster.locator("[data-lockup-content]"));
  const captionBox = await rect(caption);
  expect(captionBox.bottom).toBeCloseTo(content.bottom, 0);
  expect(captionBox.y).toBeGreaterThan(content.y);

  await poster.hover();
  await expect.poll(() => computed(caption, "opacity")).toBe("1");
  await page.mouse.move(0, 0);
  await expect.poll(() => computed(caption, "opacity")).toBe("0");

  await page.getByTestId("monogram-picture").focus();
  await page.keyboard.press("Tab");
  await expect(poster).toBeFocused();
  await expect.poll(() => computed(caption, "opacity")).toBe("1");
});

test("a lockup grows under the pointer and with keyboard focus, and not when disabled", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light" });
  const card = page.getByTestId("card");
  expect(await computed(card, "scale")).toBe("none");
  await card.hover();
  await expect.poll(() => computed(card, "scale")).toBe("1.05");
  await page.mouse.move(0, 0);
  await expect.poll(() => computed(card, "scale")).toBe("none");

  await card.focus();
  await page.keyboard.press("Tab");
  const caption = page.getByTestId("caption");
  await expect(caption).toBeFocused();
  await expect.poll(() => computed(caption, "scale")).toBe("1.05");
  expect(await computed(caption, "outline-style")).toBe("solid");

  const disabled = page.getByTestId("disabled");
  await disabled.hover({ force: true });
  expect(await computed(disabled, "scale")).toBe("none");
  // Everything inside a disabled lockup dims, the subtitle included.
  const tertiary = await resolved(disabled, "color", "var(--label-tertiary)");
  expect(await computed(disabled.getByText("Disabled"), "color")).toBe(tertiary);
});

test("with reduced motion a lockup keeps its size", async ({ page }) => {
  await openStory(page, STORY, { appearance: "light", motion: "reduced" });
  const card = page.getByTestId("card");
  await card.hover();
  await expect(card).toHaveAttribute("data-hovered", "true");
  expect(await computed(card, "scale")).toBe("1");
});

test("lockups in a row are the same size and leave room for the one in focus", async ({ page }) => {
  await openStory(page, "layout-lockup--row", { appearance: "light" });
  const boxes = await page.getByTestId("row").locator("[data-lockup]").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON()));
  expect(new Set(boxes.map((box) => Math.round(box.width))).size).toBe(1);
  expect(new Set(boxes.map((box) => Math.round(box.height))).size).toBe(1);
  // 5% of a 160 px lockup is 8 px, 4 on each side; the gap is larger.
  expect(boxes[1].x - (boxes[0].x + boxes[0].width)).toBeGreaterThan(8);
});

test("right to left lays a row out from the other side and aligns the caption to the leading edge", async ({ page }) => {
  await openStory(page, "layout-lockup--row", { appearance: "light", direction: "rtl" });
  const lockups = page.getByTestId("row").locator("[data-lockup]");
  expect((await rect(lockups.first())).x).toBeGreaterThan((await rect(lockups.nth(1))).x);
  const title = lockups.first().getByText("Morning");
  const range = await title.evaluate((element) => {
    const text = document.createRange();
    text.selectNodeContents(element);
    return { text: text.getBoundingClientRect().right, box: element.getBoundingClientRect().right };
  });
  // The text starts at the right edge of its line.
  expect(range.text).toBeCloseTo(range.box, 0);
});
