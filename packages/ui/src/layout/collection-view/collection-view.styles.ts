import { tv } from "../../foundations/utils/tv";

/**
 * Class names for a collection. Server-safe (the components are not).
 *
 * VERIFIED (HIG Collections): a collection shows its items in a horizontal row
 * or in a grid, and is for image-based content; padding around the images keeps
 * focus and hover effects easy to see.
 * INFERRED: every number and color: the three item sizes (6, 9 and 12 rem), the
 * gap, the padding and radius of an item, and the highlight around a selected
 * item, which is the library's emphasized selection (selection.css) drawn
 * behind the image the way a file browser marks the icons it has selected.
 */
export const collectionView = tv({
  slots: {
    root: "min-w-0 gap-2 text-body text-label outline-none",
    item: [
      "group/item focus-ring relative flex min-w-0 cursor-default flex-col gap-1.5 rounded-box p-2",
      "text-body text-label -outline-offset-2",
      "hover:not-selected:not-focus-visible:row-hovered pressed:not-selected:not-focus-visible:row-pressed selected:selection-emphasized",
      "disabled:content-disabled",
    ],
    empty: "col-span-full px-3 py-6 text-center text-label-secondary",
  },
  variants: {
    layout: {
      grid: { root: "grid content-start grid-cols-[repeat(auto-fill,minmax(var(--collection-item-size),1fr))]" },
      row: { root: "flex overflow-x-auto", item: "w-(--collection-item-size) shrink-0" },
    },
    itemSize: {
      small: { root: "[--collection-item-size:6rem]" },
      medium: { root: "[--collection-item-size:9rem]" },
      large: { root: "[--collection-item-size:12rem]" },
    },
  },
  defaultVariants: { layout: "grid", itemSize: "medium" },
});
