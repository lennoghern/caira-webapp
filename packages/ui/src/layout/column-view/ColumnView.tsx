"use client";

import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { ListBox, ListBoxItem, Text, type Key, type Selection } from "react-aria-components";
import { Icon } from "../../foundations/icon/Icon";
import { useResizeHandle } from "../shared/useResizeHandle";
import { columnView } from "./column-view.styles";

const styles = columnView();

export interface ColumnViewProps<T extends object>
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "onChange"> {
  /** The root level of the hierarchy. It is always the first column. */
  items: Iterable<T>;
  /**
   * The items nested in an item. Return `null` or `undefined` for an item that
   * cannot have any; an empty list is a parent that happens to be empty.
   */
  getChildren: (item: T) => Iterable<T> | null | undefined;
  /** The name of an item as plain text: for its row, for typeahead, and as the name of the column of its children. */
  getTextValue: (item: T) => string;
  /** A unique key for an item. By default its `id`. */
  getKey?: (item: T) => Key;
  /** What a row shows. By default the text value. */
  children?: (item: T) => ReactNode;
  /** The keys of the selected item of each column, from the root (controlled). */
  path?: readonly Key[];
  /** The path the view starts with. */
  defaultPath?: readonly Key[];
  /** Called when the selection of any column changes. */
  onPathChange?: (path: Key[]) => void;
  /**
   * Shown after the columns when the last selected item has no nested items:
   * information about it, as the Finder shows a preview (HIG).
   */
  renderPreview?: (item: T) => ReactNode;
  /** Shown in a column whose parent has no items. Localize it. Default "No items". */
  renderEmptyColumn?: (parent: T) => ReactNode;
  /** The width a column starts with, and returns to on a double click of its divider, in CSS px. Default 200. */
  columnWidth?: number;
  /** The smallest width a column can be resized to. Default 120. */
  minColumnWidth?: number;
  /** The largest width a column can be resized to. Default 480. */
  maxColumnWidth?: number;
  /**
   * What assistive technology is told about an item that has nested items, as
   * its description. A listbox option cannot say it is expandable, so this
   * stands in for the triangle. Localize it. Default "Has nested items".
   */
  parentItemDescription?: string;
  ref?: Ref<HTMLDivElement>;
}

interface Column<T> {
  /** The item whose children this column lists; `null` for the root column. */
  parent: T | null;
  items: T[];
}

const defaultKey = (item: object): Key => (item as { id: Key }).id;

/**
 * A column view, also called a browser: a hierarchy shown as a series of
 * columns, one per level. Selecting a parent item shows its children in the
 * next column. It is driven by data: pass the root `items` and `getChildren`.
 *
 * Client Component: it keeps the selected path and the column widths, and each
 * column is React Aria's `ListBox`.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/column-views
 * Apple API: AppKit `NSBrowser`.
 *
 * Accessibility: a `group` holding one `listbox` per column, each following the
 * APG Listbox pattern, https://www.w3.org/WAI/ARIA/apg/patterns/listbox/ , and
 * between them `separator`s following the APG Window Splitter pattern,
 * https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/ . The first column
 * takes the name of the view and each later one the name of the item it
 * belongs to, so the names of the columns read as the path. An item with
 * nested items says so in its description. Give the view an `aria-label` or
 * `aria-labelledby`.
 * Why not one `tree` (DECISIONS.md D-044): a tree needs each parent to contain
 * or own the group of its children, and here the children sit in a sibling
 * column, so the relationship could only be made with `aria-owns`, which the
 * APG notes changes the reading order. A row of listboxes keeps the DOM order,
 * the reading order and what is on screen the same. The cost: no `aria-level`
 * and no `aria-expanded`, which `option` does not support.
 * Keyboard: each column is a tab stop. Up and Down move within a column and
 * select as they go, so the next column follows; Home, End and typing work as
 * in a listbox. Right moves into the next column, selecting its first item if
 * none is; Left moves back to the parent column and clears what was selected
 * after it. Both are mirrored in right-to-left. The dividers follow
 * `SplitView`: Left and Right resize, Home and End go to the limits.
 *
 * Platform: macOS only on Apple's side. The height of a row follows the density.
 *
 * HIG guidance worth keeping in mind: use it for a deep hierarchy people move
 * back and forth in, when they do not need to sort; show the root level in the
 * first column.
 *
 * Styling: one export that owns its columns, because the columns are derived
 * from the selected path and not written by the caller (DECISIONS.md D-040).
 * `className` goes to the view; the parts are reached through
 * `[data-column-view-column]`, `[role="option"]`, `[data-column-view-divider]`
 * and `[data-column-view-preview]`. Rows carry React Aria's data attributes.
 *
 * Web interpretation, not a port. Deviations: one item is selected per column,
 * with no multiple selection; every selected item on the path keeps the same
 * highlight, where the Finder dims the ones in columns without focus; column
 * widths are not remembered. Known gaps: `parentItemDescription` is English
 * and so is the text of an empty column, unless the caller passes its own; the thin dividers share the gaps listed on
 * `SplitView`; no screen reader has been run on this structure.
 *
 * @example
 * <ColumnView
 *   aria-label="Files"
 *   items={folders}
 *   getChildren={(item) => item.children}
 *   getTextValue={(item) => item.name}
 *   renderPreview={(item) => <FileInfo file={item} />}
 * />
 */
export function ColumnView<T extends object>({
  items,
  getChildren,
  getTextValue,
  getKey = defaultKey,
  children,
  path: pathProp,
  defaultPath = [],
  onPathChange,
  renderPreview,
  renderEmptyColumn = () => "No items",
  columnWidth = 200,
  minColumnWidth = 120,
  maxColumnWidth = 480,
  parentItemDescription = "Has nested items",
  className,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ColumnViewProps<T>) {
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [pathState, setPathState] = useState<readonly Key[]>(defaultPath);
  const [widths, setWidths] = useState<Record<number, number>>({});
  // Where focus should go once the columns for a new path have rendered.
  const pendingFocus = useRef<{ column: number; key: Key } | null>(null);
  const path = pathProp ?? pathState;

  const setPath = (next: Key[]) => {
    if (pathProp === undefined) setPathState(next);
    onPathChange?.(next);
  };

  // Walk the path from the root: each selected item that can have children opens a column.
  const columns: Column<T>[] = [{ parent: null, items: [...items] }];
  let leaf: T | null = null;
  const validPath: Key[] = [];
  for (const key of path) {
    const selected = columns[columns.length - 1]!.items.find((item) => getKey(item) === key);
    if (!selected) break;
    validPath.push(key);
    const nested = getChildren(selected);
    if (nested == null) {
      leaf = selected;
      break;
    }
    columns.push({ parent: selected, items: [...nested] });
  }

  const optionOf = (column: number, key: Key) =>
    rootRef.current?.querySelector<HTMLElement>(
      `[data-column-view-column="${column}"] [role="option"][data-key="${CSS.escape(String(key))}"]`,
    ) ?? null;

  // The column the view last brought into sight, by the key of the item it belongs to.
  const lastShown = useRef<string | null>(null);
  const lastColumn = columns[columns.length - 1]!;
  const lastColumnKey = lastColumn.parent ? String(getKey(lastColumn.parent)) : "";
  useEffect(() => {
    const target = pendingFocus.current;
    if (target) {
      pendingFocus.current = null;
      optionOf(target.column, target.key)?.focus();
    }
    // Keep the newest column in sight when the end of the path changes. Only the view scrolls, never the page.
    const root = rootRef.current;
    if (root && lastShown.current !== null && lastShown.current !== lastColumnKey) {
      const rtl = getComputedStyle(root).direction === "rtl";
      root.scrollLeft = rtl ? -root.scrollWidth : root.scrollWidth;
    }
    lastShown.current = lastColumnKey;
  });

  const select = (column: number, key: Key | undefined) => {
    setPath(key === undefined ? validPath.slice(0, column) : [...validPath.slice(0, column), key]);
  };

  // In the capture phase, before the listbox sees the key: Left and Right belong to the view.
  const onKeyDownCapture = (column: number) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (!(event.target instanceof HTMLElement) || event.target.getAttribute("role") !== "option") return;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = (event.key === "ArrowRight") !== rtl;
    event.preventDefault();
    event.stopPropagation();
    if (forward) {
      const next = columns[column + 1];
      const first = next?.items[0];
      if (!next || first === undefined) return;
      const selected = validPath[column + 1];
      if (selected !== undefined) {
        optionOf(column + 1, selected)?.focus();
      } else {
        // Nothing selected there yet: select its first item, and focus it once that has rendered.
        const key = getKey(first);
        pendingFocus.current = { column: column + 1, key };
        select(column + 1, key);
      }
    } else if (column > 0) {
      const key = validPath[column - 1]!;
      // Back at the parent: nothing in this column is selected any more.
      if (validPath.length > column) setPath(validPath.slice(0, column));
      optionOf(column - 1, key)?.focus();
    }
  };

  return (
    <div
      {...props}
      ref={(element) => {
        rootRef.current = element;
        if (typeof ref === "function") return ref(element);
        if (ref) ref.current = element;
      }}
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-column-view=""
      className={styles.root({ className })}
    >
      {columns.map((column, index) => {
        const listId = `${baseId}-column-${index}`;
        const selectedKey = validPath[index];
        const name = column.parent ? getTextValue(column.parent) : undefined;
        return (
          <div
            key={column.parent ? String(getKey(column.parent)) : "root"}
            data-column-view-column={index}
            className={styles.column()}
            style={{ width: widths[index] ?? columnWidth }}
            onKeyDownCapture={onKeyDownCapture(index)}
          >
            <ListBox
              id={listId}
              // The root column is named as the view is; a later one by the item it belongs to.
              aria-label={name ?? ariaLabel}
              aria-labelledby={name === undefined ? ariaLabelledBy : undefined}
              items={column.items}
              selectionMode="single"
              // Selection follows focus, as in the Finder: the arrow keys change what the next column shows.
              selectionBehavior="replace"
              selectedKeys={selectedKey === undefined ? [] : [selectedKey]}
              onSelectionChange={(keys: Selection) => select(index, keys === "all" ? undefined : [...keys][0])}
              renderEmptyState={() => <div className={styles.empty()}>{column.parent ? renderEmptyColumn(column.parent) : null}</div>}
              className={styles.list()}
            >
              {(item) => {
                const isParent = getChildren(item) != null;
                return (
                  <ListBoxItem id={getKey(item)} textValue={getTextValue(item)} className={styles.item()}>
                    <Text slot="label" className={styles.label()}>
                      {children ? children(item) : getTextValue(item)}
                    </Text>
                    {isParent ? (
                      <>
                        <Icon name="chevron-forward" className={styles.indicator()} />
                        <Text slot="description" className="sr-only">
                          {parentItemDescription}
                        </Text>
                      </>
                    ) : null}
                  </ListBoxItem>
                );
              }}
            </ListBox>
            <ColumnDivider
              controls={listId}
              label={name ?? ariaLabel}
              labelledBy={name === undefined ? ariaLabelledBy : undefined}
              width={widths[index] ?? columnWidth}
              minWidth={minColumnWidth}
              maxWidth={maxColumnWidth}
              onResize={(width) => setWidths((current) => ({ ...current, [index]: width }))}
              onReset={() => setWidths((current) => ({ ...current, [index]: columnWidth }))}
            />
          </div>
        );
      })}
      {leaf && renderPreview ? (
        <div role="group" aria-label={getTextValue(leaf)} data-column-view-preview="" className={styles.preview()}>
          {renderPreview(leaf)}
        </div>
      ) : null}
    </div>
  );
}

interface ColumnDividerProps {
  controls: string;
  label: string | undefined;
  labelledBy: string | undefined;
  width: number;
  minWidth: number;
  maxWidth: number;
  onResize: (width: number) => void;
  onReset: () => void;
}

/** The line on the trailing edge of a column: a separator that resizes it. */
function ColumnDivider({ controls, label, labelledBy, width, minWidth, maxWidth, onResize, onReset }: ColumnDividerProps) {
  const { handleProps } = useResizeHandle({
    size: width,
    minSize: minWidth,
    maxSize: maxWidth,
    axis: "inline",
    edge: "end",
    step: 16,
    onResize: (requested) => onResize(Math.round(Math.min(maxWidth, Math.max(minWidth, requested)))),
    onReset,
  });
  return (
    <div
      {...handleProps}
      aria-controls={controls}
      aria-label={label}
      aria-labelledby={labelledBy}
      data-column-view-divider=""
      className={styles.divider()}
    />
  );
}
