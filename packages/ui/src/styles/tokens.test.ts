import { describe, expect, it } from "vitest";
import { COLOR_STATES, parseCssDeclarations, readStyleFile, resolveTokens } from "../test/css-tokens";

/**
 * Guards the values transcribed from Apple's pages (label VERIFIED in tokens.css).
 * The tables below are a second, independent transcription of the same pages,
 * read on 2026-10-08. If one of these tests fails, someone edited a verified
 * value: go back to the HIG page before changing either side.
 */

// HIG Color > Specifications > System colors.
// Columns: default light, default dark, increased contrast light, increased contrast dark.
const SYSTEM_COLORS: Record<string, [string, string, string, string]> = {
  red: ["255 56 60", "255 66 69", "233 21 45", "255 97 101"],
  orange: ["255 141 40", "255 146 48", "197 83 0", "255 160 86"],
  yellow: ["255 204 0", "255 214 0", "161 106 0", "254 223 67"],
  green: ["52 199 89", "48 209 88", "0 137 50", "74 217 104"],
  mint: ["0 200 179", "0 218 195", "0 133 117", "84 223 203"],
  teal: ["0 195 208", "0 210 224", "0 129 152", "59 221 236"],
  cyan: ["0 192 232", "60 211 254", "0 126 174", "109 217 255"],
  blue: ["0 136 255", "0 145 255", "30 110 244", "92 184 255"],
  indigo: ["97 85 245", "109 124 255", "86 74 222", "167 170 255"],
  purple: ["203 48 224", "219 52 242", "176 47 194", "234 141 255"],
  pink: ["255 45 85", "255 55 95", "231 18 77", "255 138 196"],
  brown: ["172 127 94", "183 138 102", "149 109 81", "219 166 121"],
  // HIG Color > Specifications > iOS, iPadOS system gray colors.
  gray: ["142 142 147", "142 142 147", "108 108 112", "174 174 178"],
  gray2: ["174 174 178", "99 99 102", "142 142 147", "124 124 128"],
  gray3: ["199 199 204", "72 72 74", "174 174 178", "84 84 86"],
  gray4: ["209 209 214", "58 58 60", "188 188 192", "68 68 70"],
  gray5: ["229 229 234", "44 44 46", "216 216 220", "54 54 56"],
  gray6: ["242 242 247", "28 28 30", "235 235 240", "36 36 38"],
};

// HIG Typography > Specifications. [size pt, line height pt, weight].
const TEXT_STYLES = {
  // "macOS built-in text styles".
  macos: {
    "large-title": [26, 32, 400],
    title1: [22, 26, 400],
    title2: [17, 22, 400],
    title3: [15, 20, 400],
    headline: [13, 16, 700],
    body: [13, 16, 400],
    callout: [12, 15, 400],
    subheadline: [11, 14, 400],
    footnote: [10, 13, 400],
    caption1: [10, 13, 400],
    caption2: [10, 13, 500],
  },
  // "iOS, iPadOS Dynamic Type sizes", tab "Large (default)".
  ios: {
    "large-title": [34, 41, 400],
    title1: [28, 34, 400],
    title2: [22, 28, 400],
    title3: [20, 25, 400],
    headline: [17, 22, 600],
    body: [17, 22, 400],
    callout: [16, 21, 400],
    subheadline: [15, 20, 400],
    footnote: [13, 18, 400],
    caption1: [12, 16, 400],
    caption2: [11, 13, 400],
  },
} as const;

describe("system colors match HIG Color", () => {
  it.each(COLOR_STATES.map((state, column) => ({ ...state, column })))("$label", ({ column, ...state }) => {
    const tokens = resolveTokens(state);
    for (const [name, values] of Object.entries(SYSTEM_COLORS)) {
      expect(tokens.raw(`--system-${name}`), name).toBe(`rgb(${values[column]})`);
    }
  });
});

describe("text styles match HIG Typography", () => {
  it.each(["macos", "ios"] as const)("%s", (platform) => {
    const tokens = resolveTokens({ dark: false, contrast: false, platform });
    for (const [style, [size, leading, weight]] of Object.entries(TEXT_STYLES[platform])) {
      // 1 pt is taken as 1 CSS px, stored in rem at 16 px per rem.
      expect(tokens.raw(`--text-${style}`), `${style} size`).toBe(`${size / 16}rem`);
      expect(tokens.raw(`--text-${style}--line-height`), `${style} line height`).toBe(`calc(${leading} / ${size})`);
      expect(tokens.raw(`--text-${style}--font-weight`), `${style} weight`).toBe(String(weight));
    }
  });

  it("never names or bundles a San Francisco font", () => {
    const css = ["tokens.css", "materials.css", "glass.css", "motion.css", "a11y.css", "variants.css", "index.css"]
      .map(readStyleFile)
      .join("\n")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/SF Pro|SF Compact|SF Mono|San Francisco|New York|@font-face|\.woff|\.ttf|\.otf/i);
  });
});

describe("token blocks stay complete", () => {
  // A variable set for one appearance but not for another would leak across themes.
  it.each(["tokens.css", "materials.css", "glass.css"])("%s declares the same names in all four color states", (file) => {
    const names = (variants: string[]) =>
      parseCssDeclarations(readStyleFile(file))
        .filter((declaration) => {
          const [head, ...rest] = declaration.path;
          return head === ":root, [data-appearance]" && rest.join("|") === variants.join("|");
        })
        .map((declaration) => declaration.name)
        .sort();

    const contrastLight = names(["@variant theme-contrast"]);
    expect(contrastLight.length).toBeGreaterThan(0);
    expect(names(["@variant theme-contrast", "@variant theme-dark"])).toEqual(contrastLight);
    // Everything the other blocks touch must exist in the base block.
    expect(names([])).toEqual(expect.arrayContaining(contrastLight));
    expect(names([])).toEqual(expect.arrayContaining(names(["@variant theme-dark"])));
  });

  it("uses the default accent everywhere when no custom accent is set", () => {
    for (const state of COLOR_STATES) {
      const tokens = resolveTokens(state);
      expect(tokens.value("--accent")).toBe(tokens.value("--system-blue"));
    }
  });
});

describe("motion tokens", () => {
  it("collapse moving durations under reduced motion and keep the fade", () => {
    const normal = resolveTokens({ dark: false, contrast: false });
    const reduced = resolveTokens({ dark: false, contrast: false, reducedMotion: true });
    for (const name of ["instant", "fast", "base", "slow", "morph"]) {
      expect(reduced.raw(`--motion-duration-${name}`), name).toBe("0.01ms");
      expect(normal.raw(`--motion-duration-${name}`), name).not.toBe("0.01ms");
    }
    expect(reduced.raw("--motion-duration-fade")).toBe(normal.raw("--motion-duration-fade"));
  });
});
