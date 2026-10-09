import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { LiquidGlassScope } from "../foundations/theme/LiquidGlassScope";
import type { ResolvedAppearance } from "../foundations/theme/types";
import { cn } from "../foundations/utils/cn";

/**
 * Helpers for stories only. Nothing here is exported from the package.
 * The backdrops are drawn with CSS gradients: no photograph, wallpaper or other
 * Apple asset is used anywhere in the playground (DECISIONS D-016).
 */

export type BackdropKind = "media" | "content" | "plain" | "white" | "black";

const MEDIA: CSSProperties = {
  backgroundColor: "#1d2671",
  backgroundImage: [
    "radial-gradient(circle at 18% 28%, #ff5f6d 0 16%, transparent 16.5%)",
    "radial-gradient(circle at 78% 22%, #ffd166 0 12%, transparent 12.5%)",
    "radial-gradient(circle at 62% 78%, #06d6a0 0 20%, transparent 20.5%)",
    "radial-gradient(circle at 30% 85%, #ffffff 0 7%, transparent 7.5%)",
    "repeating-linear-gradient(60deg, #1d2671 0 28px, #c33764 28px 56px)",
  ].join(", "),
};

/*
 * A drawn scene with the things a photograph has and a pattern lacks: smooth
 * gradients, a bright spot, dark masses, fine light detail. Our own drawing.
 */
const PHOTO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#162a6e"/><stop offset="0.45" stop-color="#b8477f"/>
      <stop offset="0.7" stop-color="#ff9a5a"/><stop offset="1" stop-color="#ffd98a"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c25b7a"/><stop offset="0.3" stop-color="#31306b"/><stop offset="1" stop-color="#0b0f2c"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff7d6"/><stop offset="0.35" stop-color="#ffe08a" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ffb35a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="330" fill="url(#sky)"/>
  <circle cx="540" cy="250" r="150" fill="url(#glow)"/>
  <circle cx="540" cy="250" r="46" fill="#fffbe8"/>
  <g fill="#fff" opacity="0.85">
    <circle cx="90" cy="60" r="1.6"/><circle cx="210" cy="34" r="1.2"/><circle cx="330" cy="82" r="1.4"/>
    <circle cx="150" cy="120" r="1"/><circle cx="700" cy="50" r="1.5"/><circle cx="640" cy="110" r="1"/>
  </g>
  <path d="M0 300 L90 210 L170 270 L260 170 L350 265 L430 225 L520 290 L610 215 L700 275 L800 200 L800 340 L0 340Z" fill="#3a2a72"/>
  <path d="M0 330 L120 262 L210 310 L320 246 L420 318 L560 268 L680 322 L800 280 L800 345 L0 345Z" fill="#161338"/>
  <rect y="330" width="800" height="170" fill="url(#water)"/>
  <g stroke="#ffe7b0" stroke-linecap="round" opacity="0.75">
    <line x1="470" y1="350" x2="610" y2="350" stroke-width="3"/><line x1="490" y1="368" x2="590" y2="368" stroke-width="2.5"/>
    <line x1="505" y1="386" x2="575" y2="386" stroke-width="2"/><line x1="515" y1="404" x2="565" y2="404" stroke-width="1.5"/>
  </g>
  <g fill="#ffd27a">
    <rect x="96" y="300" width="3" height="5"/><rect x="118" y="306" width="3" height="4"/><rect x="232" y="296" width="3" height="5"/>
    <rect x="300" y="302" width="3" height="4"/><rect x="662" y="304" width="3" height="5"/><rect x="734" y="298" width="3" height="5"/>
  </g>
  <path d="M40 470 C160 430 260 480 380 446 S620 420 800 462 L800 500 L0 500Z" fill="#070a1f"/>
</svg>`;

const PHOTO: CSSProperties = {
  backgroundColor: "#162a6e",
  backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(PHOTO_SVG.replace(/\n\s*/g, ""))}")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const STRIPES: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(90deg, #000 0 12px, #fff 12px 24px)",
};

const PARAGRAPH =
  "Content scrolls beneath controls and navigation. A material keeps what is in front of it legible while letting some of what is behind show through.";

export interface BackdropProps extends ComponentProps<"div"> {
  kind?: BackdropKind | "stripes" | "photo";
}

/**
 * Something for a component to sit on. Glass and materials go over `media`,
 * `photo` or `stripes`; content-layer components go on `plain`, the app
 * background of the current appearance.
 */
export function Backdrop({ kind = "media", className, style, children, ...props }: BackdropProps) {
  const fill =
    kind === "media"
      ? MEDIA
      : kind === "photo"
        ? PHOTO
        : kind === "stripes"
          ? STRIPES
          : kind === "white"
            ? { background: "#fff" }
            : kind === "black"
              ? { background: "#000" }
              : {};
  return (
    <div
      {...props}
      data-backdrop={kind}
      className={cn(
        "relative isolate overflow-hidden",
        (kind === "content" || kind === "plain") && "bg-background",
        className,
      )}
      style={{ ...fill, ...style }}
    >
      {kind === "content" ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10 columns-2 gap-6 p-4 text-body text-label">
          {Array.from({ length: 12 }, (_, index) => (
            <p key={index} className="mb-3">
              <strong className="text-headline">Section {index + 1}. </strong>
              {PARAGRAPH}
            </p>
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export interface MatrixCell {
  appearance: ResolvedAppearance;
  glass: "regular" | "clear" | "tinted";
  accessibility: "default" | "reduced transparency" | "increased contrast";
  label: string;
}

const GLASS_CLARITY = { tinted: 0, regular: 0.5, clear: 1 } as const;

export const MATRIX_CELLS: MatrixCell[] = (["light", "dark"] as const).flatMap((appearance) =>
  (["regular", "clear", "tinted"] as const).flatMap((glass) =>
    (["default", "reduced transparency", "increased contrast"] as const).map((accessibility) => ({
      appearance,
      glass,
      accessibility,
      label: `${appearance}, ${glass} glass${accessibility === "default" ? "" : `, ${accessibility}`}`,
    })),
  ),
);

export interface ThemeMatrixProps {
  /** Rendered once per cell, on top of the backdrop. */
  children: (cell: MatrixCell) => ReactNode;
  backdrop?: BackdropProps["kind"];
  cellClassName?: string;
}

/**
 * The theme matrix every component story includes (ARCHITECTURE.md section 10):
 * light and dark, by glass setting (regular, clear, tinted), by accessibility
 * state (default, reduced transparency, increased contrast). 18 cells.
 * "Glass setting" here is the macOS 27 clarity slider at 0.5, 1 and 0.
 */
export function ThemeMatrix({ children, backdrop = "media", cellClassName }: ThemeMatrixProps) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
      {MATRIX_CELLS.map((cell) => (
        <LiquidGlassScope
          key={cell.label}
          appearance={cell.appearance}
          clarity={GLASS_CLARITY[cell.glass]}
          transparency={cell.accessibility === "reduced transparency" ? "reduced" : undefined}
          contrast={cell.accessibility === "increased contrast" ? "more" : undefined}
          data-matrix-cell={cell.label}
          className="overflow-hidden rounded-xl bg-background"
        >
          <p className="px-3 py-2 text-footnote text-label-secondary">{cell.label}</p>
          <Backdrop kind={backdrop} className={cn("flex min-h-36 items-center justify-center p-5", cellClassName)}>
            {children(cell)}
          </Backdrop>
        </LiquidGlassScope>
      ))}
    </div>
  );
}

/** A titled block for laying out a story. */
export function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="p-4">
      <h2 className="text-title3 font-semibold text-label">{title}</h2>
      {note ? <p className="mt-1 max-w-prose text-callout text-label-secondary">{note}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
