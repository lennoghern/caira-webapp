/** `id` of the shared SVG filter that GlassFilterDefs renders and glass.css references. */
export const GLASS_REFRACTION_FILTER_ID = "caira-glass-refraction";

interface UserAgentData {
  brands?: readonly { brand: string }[];
}

/**
 * Whether this engine applies an SVG filter given to `backdrop-filter`. Client
 * only; `false` on the server.
 *
 * INFERRED heuristic, not a feature test. Page script cannot read the pixels a
 * backdrop filter produces, and `CSS.supports()` only reports that the value
 * parses. Measured on 2026-10-08: Firefox 157 says the value parses, and then
 * paints no backdrop filter at all for that element, blur and range compression
 * included, which also removes the contrast floor. What is known (SOURCES W7,
 * W8): only Chromium renders it. So the check is "the value parses, and the
 * engine says it is Chromium" through `navigator.userAgentData`, an API only
 * Chromium ships.
 */
export function rendersBackdropSvgFilter(): boolean {
  if (typeof window === "undefined" || typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return false;
  }
  if (!CSS.supports("backdrop-filter", 'url("#a")')) return false;
  const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  return data?.brands?.some((entry) => entry.brand === "Chromium") ?? false;
}

/**
 * Whether the page is drawn by a software rasterizer instead of a GPU. Client only.
 *
 * Why it matters: measured on 2026-10-08, Chromium's software renderer
 * (SwiftShader) dropped to about 45 ms per frame with 12 small refractive
 * surfaces, where the same page on an integrated GPU held 60 fps (PROGRESS.md).
 * INFERRED heuristic: the renderer name WebGL reports. No WebGL at all counts as
 * software.
 */
export function isSoftwareRendered(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|software|basic render/i.test(renderer);
  } catch {
    return true;
  }
}

let cached: boolean | undefined;

/**
 * Whether to use rendering tier 2 by default here: the engine renders it
 * (`rendersBackdropSvgFilter`) and does so on a GPU. Client only. The answer is
 * computed once per page.
 */
export function supportsBackdropSvgFilter(): boolean {
  if (typeof window === "undefined") return false;
  cached ??= rendersBackdropSvgFilter() && !isSoftwareRendered();
  return cached;
}

/** For tests: forget the cached answer. */
export function resetBackdropSvgFilterSupport(): void {
  cached = undefined;
}
