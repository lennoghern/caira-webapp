import { extendTailwindMerge } from "tailwind-merge";
import { twMergeConfig, type LibraryClassGroupId } from "./tailwind-merge-config";

/**
 * Joins class names and resolves Tailwind conflicts, the last one winning.
 * Aware of this library's tokens and utilities. Server-safe.
 */
export const cn = extendTailwindMerge<LibraryClassGroupId>(twMergeConfig);
