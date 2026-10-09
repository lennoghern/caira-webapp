import { GLASS_REFRACTION_FILTER_ID } from "./refraction";

export interface GlassFilterDefsProps {
  /**
   * `id` of the filter. Leave it alone for the shared filter the stylesheet
   * references. A second filter with another id can be tried on a subtree by
   * setting `--glass-refraction-filter: url(#that-id)` there.
   */
  id?: string;
  /** How far the rim bends the backdrop, as the `scale` of the displacement map. Default 48. */
  displacement?: number;
  /** Width of the bending rim: the blur, in CSS px, that shapes the edge profile. Default 7. */
  rim?: number;
  /** Strength of the edge highlight, 0 for none. Default 0.55. */
  highlight?: number;
  /** Direction the light comes from, in degrees clockwise from the right. Default 235 (top left). */
  lightAzimuth?: number;
}

/**
 * The one SVG filter every refractive glass surface shares (rendering tier 2).
 * LiquidGlassProvider mounts it once; nothing references it unless the provider
 * turns refraction on. Server-safe.
 *
 * No Apple API corresponds to this. It stands in for the lensing and specular
 * edge that `glassEffect(_:in:)` and `NSGlassEffectView` draw natively.
 * STANDARD: SVG `feDisplacementMap` and `feSpecularLighting`. Only Chromium
 * applies an SVG filter through `backdrop-filter` (SOURCES W7, W8).
 * INFERRED: the whole recipe and every number in it.
 *
 * How it works, with no per-element map:
 *  1. Flood the filter region, which is exactly the element's box, and blur it.
 *     That gives a height field: 1 inside, falling to about 0.5 at every edge.
 *  2. Two Sobel passes turn the slope of that field into a displacement map
 *     (red = horizontal, green = vertical, 0.5 = no movement).
 *  3. `feDisplacementMap` bends the backdrop inward along the rim.
 *  4. `feSpecularLighting` reads the same height field and adds a highlight on
 *     the edges that face the light.
 * Lengths are in CSS px, so the rim keeps its width at any element size.
 */
export function GlassFilterDefs({
  id = GLASS_REFRACTION_FILTER_ID,
  displacement = 48,
  rim = 7,
  highlight = 0.55,
  lightAzimuth = 235,
}: GlassFilterDefsProps = {}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      // Not `display: none`: a hidden <svg> can make its filters unusable.
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
    >
      <defs>
        <filter id={id} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feFlood floodColor="#fff" result="box" />
          <feGaussianBlur in="box" stdDeviation={rim} result="soft" />
          {/* Height as an opaque gray so the convolutions see plain numbers. */}
          <feColorMatrix in="soft" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result="height" />
          <feConvolveMatrix
            in="height"
            order="3"
            kernelMatrix="-1 0 1 -2 0 2 -1 0 1"
            divisor="2"
            bias="0.5"
            edgeMode="duplicate"
            preserveAlpha="true"
            result="slopeX"
          />
          <feConvolveMatrix
            in="height"
            order="3"
            kernelMatrix="-1 -2 -1 0 0 0 1 2 1"
            divisor="2"
            bias="0.5"
            edgeMode="duplicate"
            preserveAlpha="true"
            result="slopeY"
          />
          <feColorMatrix in="slopeX" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="mapX" />
          <feColorMatrix in="slopeY" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="mapY" />
          <feComposite in="mapX" in2="mapY" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={displacement}
            xChannelSelector="R"
            yChannelSelector="G"
            result="bent"
          />
          <feSpecularLighting
            in="soft"
            surfaceScale="5"
            specularConstant="0.9"
            specularExponent="40"
            lightingColor="#fff"
            result="glint"
          >
            <feDistantLight azimuth={lightAzimuth} elevation="30" />
          </feSpecularLighting>
          <feComposite in="glint" in2="bent" operator="arithmetic" k1="0" k2={highlight} k3="1" k4="0" />
        </filter>
      </defs>
    </svg>
  );
}
