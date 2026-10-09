import type { StyleWithVars } from "../utils/types";

/** Smallest inner radius, in CSS px, matching `--concentric-min` in tokens.css. */
export const CONCENTRIC_MIN_RADIUS = 4;

/**
 * Radius of a shape nested inside a rounded container so both curves share a
 * center: inner radius = outer radius - padding, never below `minimum`.
 * Values are in CSS px. Server-safe.
 *
 * VERIFIED rule: "Adopting Liquid Glass" (concentric shapes) and WWDC26 session
 * 289. Apple reference: SwiftUI `ConcentricRectangle`, AppKit
 * `.containerConcentric`. INFERRED: the floor; Apple publishes none.
 *
 * @example
 * concentric(16, 6) // 10
 * concentric(8, 12) // 4 (the floor)
 */
export function concentric(outerRadius: number, padding: number, minimum: number = CONCENTRIC_MIN_RADIUS): number {
  if (!Number.isFinite(outerRadius) || !Number.isFinite(padding)) return minimum;
  return Math.max(minimum, outerRadius - Math.max(0, padding));
}

/**
 * Style for a container whose direct children use the `rounded-concentric`
 * utility. It sets the container's own radius and padding, and publishes both
 * as `--concentric-radius` and `--concentric-padding`.
 *
 * CSS cannot pass the computed inner radius down another level under the same
 * name, so a nested container calls this again with `concentric(outer, padding)`
 * as its radius.
 */
export function concentricContainerStyle(radius: number, padding: number): StyleWithVars {
  return {
    borderRadius: radius,
    padding,
    "--concentric-radius": `${radius}px`,
    "--concentric-padding": `${padding}px`,
  };
}
