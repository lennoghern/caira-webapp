import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { colorMix, parseColor, type Rgba } from "./color";

/**
 * Reads the design tokens straight out of `src/styles/*.css`, so tests assert
 * against the values that ship and not against a copy of them.
 *
 * It understands exactly the shape those files use: custom property
 * declarations inside `@theme`, `:root, [...]` blocks and `[data-platform="ios"]`,
 * with `@variant theme-dark`, `@variant theme-contrast` and
 * `@variant theme-motion-reduced` nested inside. Utilities (`@utility`) are
 * element-level and are skipped.
 */

export interface CssDeclaration {
  /** Preludes of the enclosing blocks, outermost first. */
  path: string[];
  name: string;
  value: string;
}

export function parseCssDeclarations(css: string): CssDeclaration[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const declarations: CssDeclaration[] = [];
  const path: string[] = [];
  let buffer = "";
  let parens = 0;
  let quote: string | null = null;

  const flush = () => {
    const match = /^(--[\w-]+)\s*:\s*([\s\S]+)$/.exec(buffer.trim());
    if (match) {
      declarations.push({ path: [...path], name: match[1]!, value: match[2]!.replace(/\s+/g, " ").trim() });
    }
    buffer = "";
  };

  for (const char of text) {
    if (quote !== null) {
      buffer += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      buffer += char;
      continue;
    }
    if (char === "(") parens += 1;
    if (char === ")") parens -= 1;
    if (parens === 0 && char === "{") {
      path.push(buffer.replace(/\s+/g, " ").trim());
      buffer = "";
    } else if (parens === 0 && char === "}") {
      flush();
      path.pop();
    } else if (parens === 0 && char === ";") {
      flush();
    } else {
      buffer += char;
    }
  }
  return declarations;
}

export const STYLE_FILES = ["tokens.css", "materials.css", "glass.css", "motion.css"] as const;

// Not `new URL(path, import.meta.url)`: Vite rewrites that pattern as an asset reference.
const STYLES_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "../styles");

export function readStyleFile(name: string): string {
  return readFileSync(resolve(STYLES_DIRECTORY, name), "utf8");
}

export interface ThemeState {
  dark: boolean;
  contrast: boolean;
  platform?: "macos" | "ios";
  reducedMotion?: boolean;
}

function applies(path: string[], state: ThemeState): boolean {
  const [head, ...rest] = path;
  if (head === undefined) return false;
  const isTheme = head.startsWith("@theme");
  const isRoot = head.split(",").some((selector) => selector.trim() === ":root");
  const isIos = head === '[data-platform="ios"]' && state.platform === "ios";
  if (!isTheme && !isRoot && !isIos) return false;
  return rest.every((entry) => {
    const variant = /^@variant\s+([\w-]+)$/.exec(entry)?.[1];
    if (variant === "theme-dark") return state.dark;
    if (variant === "theme-contrast") return state.contrast;
    if (variant === "theme-motion-reduced") return state.reducedMotion === true;
    return false;
  });
}

/** Splits on commas that are not inside parentheses. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts;
}

/** Index of the `)` that closes the `(` at `open`. */
function closingParen(text: string, open: number): number {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === "(") depth += 1;
    if (text[index] === ")") depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error(`Unbalanced parentheses in "${text}"`);
}

export class TokenSet {
  readonly #values: Map<string, string>;

  constructor(values: Map<string, string>) {
    this.#values = values;
  }

  has(name: string): boolean {
    return this.#values.has(name);
  }

  names(): string[] {
    return [...this.#values.keys()];
  }

  /** The declared value, untouched. */
  raw(name: string): string {
    const value = this.#values.get(name);
    if (value === undefined) throw new Error(`Token ${name} is not declared for this theme state`);
    return value;
  }

  /** The value with every `var()` substituted, as the browser would compute it at the theme root. */
  value(name: string): string {
    return this.#substitute(this.raw(name), new Set([name]));
  }

  number(name: string): number {
    const value = Number(this.value(name).replace(/px$/, ""));
    if (!Number.isFinite(value)) throw new Error(`Token ${name} is not a number: "${this.value(name)}"`);
    return value;
  }

  color(name: string): Rgba {
    return evaluateColor(this.value(name));
  }

  #substitute(text: string, seen: Set<string>): string {
    let result = text;
    for (;;) {
      const start = result.indexOf("var(");
      if (start === -1) return result;
      const end = closingParen(result, start + 3);
      const [reference, ...fallback] = splitTopLevel(result.slice(start + 4, end));
      if (reference === undefined) throw new Error(`Empty var() in "${text}"`);
      let replacement: string;
      if (this.#values.has(reference) && !seen.has(reference)) {
        replacement = this.#substitute(this.#values.get(reference)!, new Set([...seen, reference]));
      } else if (fallback.length > 0) {
        replacement = this.#substitute(fallback.join(", "), seen);
      } else {
        throw new Error(`var(${reference}) has no value and no fallback in "${text}"`);
      }
      result = result.slice(0, start) + replacement + result.slice(end + 1);
    }
  }
}

/** Evaluates a substituted color value, including `color-mix(in srgb, A p%, B)`. */
export function evaluateColor(text: string): Rgba {
  const value = text.trim();
  if (!value.startsWith("color-mix(")) return parseColor(value);
  const [space, first, second] = splitTopLevel(value.slice("color-mix(".length, closingParen(value, 9)));
  if (space !== "in srgb" || first === undefined || second === undefined) {
    throw new Error(`Unsupported color-mix(): "${text}"`);
  }
  const match = /^([\s\S]+?)\s+([\d.]+)%$/.exec(first);
  if (!match) throw new Error(`color-mix() needs a percentage on its first color: "${text}"`);
  return colorMix(evaluateColor(match[1]!), Number(match[2]) / 100, evaluateColor(second));
}

const declarationCache = new Map<string, CssDeclaration[]>();

function declarationsOf(file: string): CssDeclaration[] {
  let declarations = declarationCache.get(file);
  if (declarations === undefined) {
    declarations = parseCssDeclarations(readStyleFile(file));
    declarationCache.set(file, declarations);
  }
  return declarations;
}

/** The tokens in effect at the theme root for one theme state, following source order like the cascade. */
export function resolveTokens(state: ThemeState, files: readonly string[] = STYLE_FILES): TokenSet {
  const values = new Map<string, string>();
  for (const file of files) {
    for (const declaration of declarationsOf(file)) {
      if (applies(declaration.path, state)) values.set(declaration.name, declaration.value);
    }
  }
  return new TokenSet(values);
}

/** Every theme state the stylesheets distinguish for color. */
export const COLOR_STATES: readonly (ThemeState & { label: string })[] = [
  { label: "light", dark: false, contrast: false },
  { label: "dark", dark: true, contrast: false },
  { label: "light, increased contrast", dark: false, contrast: true },
  { label: "dark, increased contrast", dark: true, contrast: true },
];
