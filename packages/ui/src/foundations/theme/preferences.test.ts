import { describe, expect, it } from "vitest";
import { clampClarity, normalizeLayout, normalizePreferences } from "./preferences";
import { DEFAULT_LAYOUT, DEFAULT_PREFERENCES } from "./types";

describe("normalizePreferences", () => {
  it("returns the base for anything that is not an object", () => {
    for (const input of [undefined, null, "dark", 3, []]) {
      expect(normalizePreferences(input)).toEqual(DEFAULT_PREFERENCES);
    }
  });

  it("keeps valid fields and replaces invalid ones", () => {
    expect(
      normalizePreferences({
        appearance: "dark",
        clarity: 0.2,
        transparency: "opaque",
        contrast: "more",
        motion: 1,
        platform: "ios",
        accent: "  rebeccapurple ",
      }),
    ).toEqual({
      appearance: "dark",
      clarity: 0.2,
      transparency: "system",
      contrast: "more",
      motion: "system",
      platform: "ios",
      accent: "rebeccapurple",
    });
  });

  it("clamps clarity to 0..1", () => {
    expect(normalizePreferences({ clarity: 7 }).clarity).toBe(1);
    expect(normalizePreferences({ clarity: -1 }).clarity).toBe(0);
    expect(normalizePreferences({ clarity: "0.9" }).clarity).toBe(DEFAULT_PREFERENCES.clarity);
    expect(clampClarity(Number.NaN)).toBe(DEFAULT_PREFERENCES.clarity);
  });

  it("lets a patch clear the accent with null", () => {
    const base = { ...DEFAULT_PREFERENCES, accent: "red" };
    expect(normalizePreferences({ ...base, accent: null }, base).accent).toBeNull();
    expect(normalizePreferences({ accent: "" }, base).accent).toBe("red");
  });
});

describe("normalizeLayout", () => {
  it("defaults to the macOS 27 behaviors", () => {
    expect(normalizeLayout(undefined)).toEqual(DEFAULT_LAYOUT);
    expect(DEFAULT_LAYOUT).toEqual({
      toolbarStyle: "uniform",
      sidebarStyle: "edge-to-edge",
      windowCorners: "uniform",
      activeWindowEmphasis: "strong",
      menuIcons: "selective",
    });
  });

  it("accepts the earlier behaviors and rejects unknown values", () => {
    expect(
      normalizeLayout({ sidebarStyle: "floating", menuIcons: "all", toolbarStyle: "bogus" as "floating" }),
    ).toEqual({ ...DEFAULT_LAYOUT, sidebarStyle: "floating", menuIcons: "all" });
  });
});
