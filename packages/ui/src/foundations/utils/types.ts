import type { CSSProperties } from "react";

/** A style object that may also carry CSS custom properties. */
export type StyleWithVars = CSSProperties & Record<`--${string}`, string | number | undefined>;
