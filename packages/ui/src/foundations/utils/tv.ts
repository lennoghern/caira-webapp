import { createTV, type VariantProps } from "tailwind-variants";
import { twMergeConfig } from "./tailwind-merge-config";

/**
 * `tailwind-variants` bound to this library's tailwind-merge configuration.
 * Every `*.styles.ts` file uses this `tv`, never the one from the package.
 * Server-safe.
 */
export const tv = createTV({ twMergeConfig });

export type { VariantProps };
