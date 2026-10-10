"use client";

import { createContext, use, type ReactNode, type Ref } from "react";
import { composeRenderProps, GridList, GridListItem, type GridListItemProps, type GridListProps } from "react-aria-components";
import { collectionView } from "./collection-view.styles";

export type CollectionLayout = "grid" | "row";
export type CollectionItemSize = "small" | "medium" | "large";

const LayoutContext = createContext<CollectionLayout>("grid");

export interface CollectionViewProps<T extends object> extends Omit<GridListProps<T>, "layout" | "orientation"> {
  /**
   * `grid` (default): as many columns as fit, wrapping onto further rows.
   * `row`: a single horizontal row that scrolls. These are the two standard
   * layouts; the HIG advises against inventing others.
   */
  layout?: CollectionLayout;
  /** The least width of an item in a grid, and the width of an item in a row. Default `medium`. */
  itemSize?: CollectionItemSize;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A collection: an ordered set of content, usually images, in a grid or in a
 * horizontal row, which people can select and act on. Compose it from
 * `CollectionItem`s. For text, a list or a table is easier to read.
 *
 * Exported as `CollectionView`: `Collection` is the name of React Aria's own
 * collection builder, which callers use next to this one.
 *
 * Client Component: it is React Aria's `GridList` in its grid layout, which
 * holds focus and selection.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/collections
 * Apple API: UIKit `UICollectionView`, AppKit `NSCollectionView`.
 *
 * Accessibility: the APG Grid pattern,
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/ . A `grid` of `row` elements
 * with one `gridcell` each; an item may hold controls of its own. Give the
 * collection an `aria-label`, and every image a text alternative or an item
 * `textValue`.
 * Keyboard: the collection is one tab stop. In a grid the four arrow keys move
 * to the item in that direction, as it is laid out on screen; in a row, Left
 * and Right. Home and End go to the first and last item; typing moves to the
 * item that starts with what was typed. Space selects, Enter performs the
 * item's action. With `selectionMode="multiple"`, Shift with the arrows
 * extends and Control or Command with A selects all; Escape clears.
 *
 * Platform: none. On Apple's side collections are not available in watchOS.
 *
 * HIG guidance worth keeping in mind: keep item sizes consistent; leave enough
 * padding for hover and focus effects; avoid changing the layout while people
 * are looking at it, unless they asked for it.
 *
 * Styling: compound parts, each a named export with its own `className` and
 * `ref` (DECISIONS.md D-040). State is on React Aria's data attributes:
 * `data-selected`, `data-hovered`, `data-pressed`, `data-focus-visible`,
 * `data-disabled`, `data-layout`, `data-empty`.
 *
 * Web interpretation, not a port. Deviations: no touch-and-hold edit mode, and
 * no animation of our own when items are inserted, deleted or reordered.
 * Known gaps: not virtualized, so every item is in the page (React Aria's
 * `Virtualizer` is not wired in); reordering passes through React Aria's
 * `dragAndDropHooks` with no handle drawn and no way of ours to reorder
 * without dragging, which an app that turns it on must provide (WCAG 2.2 2.5.7).
 *
 * @example
 * <CollectionView aria-label="Photos" selectionMode="multiple">
 *   <CollectionItem id="a" textValue="Beach">
 *     <img src="…" alt="" />
 *     Beach
 *   </CollectionItem>
 * </CollectionView>
 */
export function CollectionView<T extends object>({
  layout = "grid",
  itemSize = "medium",
  className,
  renderEmptyState,
  ref,
  ...props
}: CollectionViewProps<T>) {
  const styles = collectionView({ layout, itemSize });
  return (
    <LayoutContext value={layout}>
      <GridList
        {...props}
        ref={ref}
        // Both layouts are a grid to React Aria, which reads rows and columns from where the items are
        // drawn: a row is a grid of one line. Its horizontal stack does not move with Left and Right
        // (1.22.0, observed), which is what a row of items needs.
        layout="grid"
        data-collection-layout={layout}
        renderEmptyState={
          renderEmptyState ? (renderProps) => <div className={styles.empty()}>{renderEmptyState(renderProps)}</div> : undefined
        }
        className={composeRenderProps(className, (value) => styles.root({ className: value }))}
      />
    </LayoutContext>
  );
}

export interface CollectionItemProps<T extends object = object> extends Omit<GridListItemProps<T>, "children"> {
  /** The content of the item: usually an image, with a short caption under it. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** One item of a `CollectionView`. Client Component (React Aria `GridListItem`). */
export function CollectionItem<T extends object = object>({ children, className, ref, ...props }: CollectionItemProps<T>) {
  const styles = collectionView({ layout: use(LayoutContext) });
  return (
    <GridListItem
      {...props}
      ref={ref}
      className={composeRenderProps(className, (value) => styles.item({ className: value }))}
    >
      {children}
    </GridListItem>
  );
}
