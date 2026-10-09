import { composeStories, setProjectAnnotations } from "@storybook/react-vite";
import type { ComponentType } from "react";
import preview from "../../../.storybook/preview";

/**
 * Renders the Storybook stories without the Storybook application, through
 * Storybook's own portable-stories API. Same story files, same preview
 * decorators, same toolbar globals.
 *
 * Why it exists: the browser tests need every story on a plain URL, and they
 * must not depend on the Storybook CLI being runnable on the machine at hand.
 * It is not a replacement for the playground: no addon panels, no controls, no docs.
 */

type StoryModule = Record<string, unknown> & { default: { title?: string } };

export interface StoryEntry {
  /** Same scheme as Storybook: `foundations-glasssurface--variants`. */
  id: string;
  title: string;
  name: string;
  exportName: string;
}

const modules = import.meta.glob<StoryModule>("../../../src/**/*.stories.tsx", { eager: true });

setProjectAnnotations(preview);

const sanitize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const exportToId = (exportName: string) => sanitize(exportName.replace(/([a-z0-9])([A-Z])/g, "$1 $2"));

const byId = new Map<string, { entry: StoryEntry; storyModule: StoryModule }>();

for (const storyModule of Object.values(modules)) {
  const title = storyModule.default.title;
  if (!title) continue;
  for (const [exportName, Story] of Object.entries(composeStories(storyModule))) {
    const id = `${sanitize(title)}--${exportToId(exportName)}`;
    const name = (Story as { storyName?: string }).storyName ?? exportName;
    byId.set(id, { entry: { id, title, name, exportName }, storyModule });
  }
}

export const stories: StoryEntry[] = [...byId.values()]
  .map((item) => item.entry)
  .sort((a, b) => a.title.localeCompare(b.title) || a.name.localeCompare(b.name));

export const globalTypes = preview.globalTypes ?? {};
export const initialGlobals: Record<string, string> = { ...(preview.initialGlobals as Record<string, string>) };

/** Parses Storybook's own syntax: `appearance:dark;clarity:1`. Unknown keys and values are dropped. */
export function parseGlobals(text: string | null): Record<string, string> {
  const globals = { ...initialGlobals };
  for (const pair of (text ?? "").split(";")) {
    const [key, value] = pair.split(":");
    if (!key || value === undefined || !(key in globalTypes)) continue;
    const items = (globalTypes[key]?.toolbar as { items?: { value: string }[] } | undefined)?.items ?? [];
    if (items.some((item) => item.value === value)) globals[key] = value;
  }
  return globals;
}

export function formatGlobals(globals: Record<string, string>): string {
  return Object.entries(globals)
    .filter(([key, value]) => initialGlobals[key] !== value)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}

/** The story as a component, with the preview decorators applied for the given globals. */
export function composeStory(id: string, globals: Record<string, string>): ComponentType | null {
  const found = byId.get(id);
  if (!found) return null;
  const composed = composeStories(found.storyModule, { initialGlobals: globals }) as Record<string, ComponentType>;
  return composed[found.entry.exportName] ?? null;
}
