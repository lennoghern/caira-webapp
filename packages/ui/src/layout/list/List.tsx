"use client";

import { createContext, use, type ReactNode, type Ref } from "react";
import {
  composeRenderProps,
  GridList,
  GridListHeader,
  GridListItem,
  GridListSection,
  type GridListHeaderProps,
  type GridListItemProps,
  type GridListProps,
  type GridListSectionProps,
} from "react-aria-components";
import { Icon } from "../../foundations/icon/Icon";
import { cn } from "../../foundations/utils/cn";
import { list } from "./list.styles";

export type ListStyle = "plain" | "inset";
export type ListSelectionStyle = "highlight" | "checkmark";

interface ListContextValue {
  listStyle: ListStyle;
  selectionStyle: ListSelectionStyle;
}

const ListContext = createContext<ListContextValue>({ listStyle: "plain", selectionStyle: "highlight" });

export interface ListProps<T extends object> extends GridListProps<T> {
  /**
   * `plain` (default): rows from edge to edge with a hairline between them.
   * `inset`: the rows sit in a rounded, filled shape, the way a grouped list
   * sets its groups apart.
   */
  listStyle?: ListStyle;
  /**
   * How a selected row shows it. `highlight` (default) for a list that leads
   * somewhere: the row stays highlighted. `checkmark` for a list of options:
   * the row shows a checkmark at its trailing edge (HIG Lists and tables).
   */
  selectionStyle?: ListSelectionStyle;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A list: rows of data in one column, which people can select, act on and
 * navigate from. Compose it from `ListItem`, and `ListSection` with
 * `ListHeader` for groups. For several columns use `Table`; for a hierarchy,
 * `OutlineView`.
 *
 * Client Component: it is React Aria's `GridList`, which holds focus and
 * selection.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
 * Apple API: SwiftUI `List` and `ListStyle`, UIKit `UITableView` with
 * `UIListContentConfiguration`, AppKit `NSTableView`.
 *
 * Accessibility: the APG Grid pattern, as a one-column grid,
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/ . A `grid` of `row` elements,
 * each with one `gridcell`, so a row may hold buttons and links of its own,
 * which a listbox option may not. Give the list an `aria-label`.
 * Keyboard: the list is one tab stop. Up and Down move between rows; Home and
 * End go to the first and last; typing moves to the row that starts with what
 * was typed. Space selects, Enter performs the row's action. Left and Right
 * move among the controls inside a row. With `selectionMode="multiple"`, Shift
 * with the arrows extends and Control or Command with A selects all; Escape
 * clears.
 *
 * Platform: the height of a row follows the density (28 px at macOS density,
 * 44 px at iOS density).
 *
 * HIG guidance worth keeping in mind: prefer a list for text and a collection
 * for images; keep row text short; give a single list a label or a header.
 *
 * Styling: compound parts, each a named export with its own `className` and
 * `ref` (DECISIONS.md D-040). State is on React Aria's data attributes:
 * `data-selected`, `data-hovered`, `data-pressed`, `data-focus-visible`,
 * `data-disabled`, `data-empty`.
 *
 * Web interpretation, not a port. Deviations: no edit mode, swipe actions or
 * index of letters; the watchOS elliptical style is not offered; text is cut at
 * the end, not in the middle. Reordering passes through React Aria's
 * `dragAndDropHooks`; the library draws no drag handle yet and adds no way to
 * reorder without dragging, which an app that turns it on must provide
 * (WCAG 2.2 2.5.7).
 *
 * @example
 * <List aria-label="Mailboxes" selectionMode="single">
 *   <ListItem id="inbox">Inbox</ListItem>
 *   <ListItem id="sent">Sent</ListItem>
 * </List>
 */
export function List<T extends object>({
  listStyle = "plain",
  selectionStyle = "highlight",
  className,
  renderEmptyState,
  ref,
  ...props
}: ListProps<T>) {
  const styles = list({ listStyle, selectionStyle });
  return (
    <ListContext value={{ listStyle, selectionStyle }}>
      <GridList
        {...props}
        ref={ref}
        data-list-style={listStyle}
        renderEmptyState={
          renderEmptyState ? (renderProps) => <div className={styles.empty()}>{renderEmptyState(renderProps)}</div> : undefined
        }
        className={composeRenderProps(className, (value) => styles.root({ className: value }))}
      />
    </ListContext>
  );
}

export interface ListItemProps<T extends object = object> extends Omit<GridListItemProps<T>, "children"> {
  /** The content of the row. Usually a `Label`, or text with a small leading image. */
  children?: ReactNode;
  /**
   * Draws the indicator of a row that drills into another view, at its
   * trailing edge. It is a mark, not a control: the row itself is pressed.
   */
  disclosureIndicator?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** One row of a `List`. Client Component (React Aria `GridListItem`). */
export function ListItem<T extends object = object>({
  children,
  disclosureIndicator = false,
  className,
  textValue,
  ref,
  ...props
}: ListItemProps<T>) {
  const { listStyle, selectionStyle } = use(ListContext);
  const styles = list({ listStyle, selectionStyle });
  const showsCheckmark = selectionStyle === "checkmark";
  return (
    <GridListItem
      {...props}
      ref={ref}
      // Typeahead and the row's name need text; plain text content provides it.
      textValue={textValue ?? (typeof children === "string" ? children : undefined)}
      className={composeRenderProps(className, (value) => styles.item({ className: value }))}
    >
      <span className={styles.content()}>{children}</span>
      {showsCheckmark || disclosureIndicator ? (
        <span className={styles.accessory()}>
          {showsCheckmark ? <Icon name="checkmark" className={styles.checkmark()} /> : null}
          {disclosureIndicator ? <Icon name="chevron-forward" /> : null}
        </span>
      ) : null}
    </GridListItem>
  );
}

export interface ListSectionProps<T extends object> extends GridListSectionProps<T> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * A group of rows inside a `List`, named by its `ListHeader`.
 * Client Component (React Aria `GridListSection`).
 */
export function ListSection<T extends object>({ className, ref, ...props }: ListSectionProps<T>) {
  const styles = list();
  return <GridListSection {...props} ref={ref} className={cn(styles.section(), className)} />;
}

export interface ListHeaderProps extends GridListHeaderProps {
  ref?: Ref<HTMLDivElement>;
}

/**
 * The header of a `ListSection`: a noun or short noun phrase in title-style
 * capitalization. Client Component (React Aria `GridListHeader`).
 */
export function ListHeader({ className, ref, ...props }: ListHeaderProps) {
  const styles = list();
  return <GridListHeader {...props} ref={ref} className={cn(styles.header(), className)} />;
}
