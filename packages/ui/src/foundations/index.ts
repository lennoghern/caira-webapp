/**
 * @caira/ui/foundations
 *
 * This barrel carries no "use client" directive on purpose: each file decides
 * for itself, so the server-safe exports stay usable from Server Components.
 *
 *   Server-safe          GlassSurface, GlassReveal, GlassGroup, GlassFilterDefs, Material,
 *                        Icon, ThemeScript, LiquidGlassScope, cn, tv, concentric and
 *                        the style helpers
 *   Client Components    LiquidGlassProvider
 *   Client hooks         useLiquidGlass, useMediaQuery
 */
export * from "./glass";
export * from "./icon";
export * from "./materials";
export * from "./theme";
export * from "./utils";
