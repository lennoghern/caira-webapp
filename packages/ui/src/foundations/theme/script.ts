import { LAYOUT_ATTRIBUTES, type LiquidGlassLayout, type LiquidGlassPreferences } from "./types";

/**
 * Source of the inline script that applies the stored theme before first paint
 * (bundled Next.js guide "How to prevent flash before hydration"). Server-safe.
 *
 * It is written by hand as a string, in old-style JavaScript, so no bundler
 * helper or minifier rename can leak into it. It must produce exactly what
 * `applyThemeDomState(themeDomState(...))` produces; `script.test.ts` checks that.
 */

// The two Unicode line separators end a line in older JavaScript parsers. The
// pattern is built from code points so this file never holds the raw characters.
const LINE_SEPARATORS = new RegExp(`[${String.fromCharCode(0x2028, 0x2029)}]`, "g");

/** JSON that is safe inside a <script> element. */
function embed(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(LINE_SEPARATORS, (char) => `\\u${char.charCodeAt(0).toString(16)}`);
}

export function themeScriptSource(
  storageKey: string | null,
  defaults: LiquidGlassPreferences,
  layout: LiquidGlassLayout,
): string {
  const layoutAttributes: Record<string, string> = {};
  for (const key of Object.keys(LAYOUT_ATTRIBUTES) as (keyof LiquidGlassLayout)[]) {
    layoutAttributes[LAYOUT_ATTRIBUTES[key]] = layout[key];
  }
  return [
    "(function(){try{",
    `var d=document.documentElement,k=${embed(storageKey)},D=${embed(defaults)},L=${embed(layoutAttributes)},s=null;`,
    `try{s=k?JSON.parse(localStorage.getItem(k)||"null"):null}catch(e){}`,
    `if(!s||typeof s!=="object")s={};`,
    `function o(v,a,f){return typeof v==="string"&&a.indexOf(v)>-1?v:f}`,
    `function a(n,v){v==null?d.removeAttribute(n):d.setAttribute(n,v)}`,
    `var ap=o(s.appearance,["system","light","dark"],D.appearance),`,
    `tr=o(s.transparency,["system","reduced"],D.transparency),`,
    `co=o(s.contrast,["system","more"],D.contrast),`,
    `mo=o(s.motion,["system","reduced"],D.motion),`,
    `pl=o(s.platform,["macos","ios"],D.platform),`,
    `cl=typeof s.clarity==="number"&&isFinite(s.clarity)?Math.min(1,Math.max(0,s.clarity)):D.clarity,`,
    `ac=typeof s.accent==="string"&&s.accent.trim()?s.accent.trim():s.accent===null?null:D.accent;`,
    `a("data-appearance",ap==="system"?null:ap);`,
    `a("data-transparency",tr==="reduced"?tr:null);`,
    `a("data-contrast",co==="more"?co:null);`,
    `a("data-motion",mo==="reduced"?mo:null);`,
    `a("data-platform",pl);`,
    `for(var n in L)a(n,L[n]);`,
    `d.style.setProperty("--glass-clarity",String(cl));`,
    `if(ac&&(!window.CSS||!CSS.supports||CSS.supports("color",ac)))d.style.setProperty("--accent-custom",ac);`,
    `else d.style.removeProperty("--accent-custom");`,
    "}catch(e){}})()",
  ].join("");
}
