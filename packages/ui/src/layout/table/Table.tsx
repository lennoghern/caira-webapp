"use client";

import type { ReactNode, Ref } from "react";
import {
  Button,
  Cell as AriaCell,
  Column as AriaColumn,
  ColumnResizer,
  composeRenderProps,
  ResizableTableContainer as AriaResizableTableContainer,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  type CellProps as AriaCellProps,
  type ColumnProps as AriaColumnProps,
  type ResizableTableContainerProps as AriaResizableTableContainerProps,
  type RowProps as AriaRowProps,
  type TableBodyProps as AriaTableBodyProps,
  type TableHeaderProps as AriaTableHeaderProps,
  type TableProps as AriaTableProps,
} from "react-aria-components";
import { Icon } from "../../foundations/icon/Icon";
import { cn } from "../../foundations/utils/cn";
import { table } from "./table.styles";

const styles = table();

export interface TableProps extends AriaTableProps {
  /**
   * Alternating row backgrounds, for a wide table with several columns, where
   * they help the eye follow a row (HIG Lists and tables, macOS).
   */
  striped?: boolean;
  ref?: Ref<HTMLTableElement | HTMLDivElement>;
}

/**
 * A table: rows of data in several columns, with headings that can sort and
 * columns that can be resized. Compose it from `TableHeader`, `Column`,
 * `TableBody`, `Row` and `Cell`. With `treeColumn` it is the several-column
 * form of an outline view: rows nest, and the named column shows the hierarchy.
 *
 * Client Component: it is React Aria's `Table`, which holds focus, selection,
 * sorting and expansion.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
 * and, with `treeColumn`,
 * https://developer.apple.com/design/human-interface-guidelines/outline-views
 * Apple API: SwiftUI `Table`, UIKit `UITableView`, AppKit `NSTableView` and
 * `NSOutlineView`.
 *
 * Accessibility: the APG Grid pattern,
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/ : a `grid` of `row`,
 * `columnheader`, `rowheader` and `gridcell`, sorted columns carrying
 * `aria-sort`. With `treeColumn`, the APG Treegrid pattern,
 * https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/ : a `treegrid` whose rows
 * carry `aria-level`, `aria-posinset`, `aria-setsize` and, when they have
 * children, `aria-expanded`. Mark the column that names a row with
 * `isRowHeader`, and give the table an `aria-label`.
 * Keyboard: the table is one tab stop. Up and Down move between rows, Left and
 * Right between the cells of a row, Home and End to the ends of a row, Page Up
 * and Page Down by a page. Enter on a sortable heading sorts by it, and again
 * reverses the order. Space selects a row; Enter performs its action, except
 * while rows are selected in the default `toggle` selection behavior, where a
 * press belongs to selection. In a treegrid, Right on a collapsed row expands
 * it and Left on an expanded row collapses it.
 *
 * Platform: the height of a row follows the density (28 px at macOS density,
 * 44 px at iOS density).
 *
 * HIG guidance worth keeping in mind: headings are nouns or short noun phrases
 * in title-style capitalization with no ending punctuation; show the hierarchy
 * in the first column only; keep the expansion state between visits
 * (`expandedKeys` and `onExpandedChange` are there for that).
 *
 * Styling: compound parts, each a named export with its own `className` and
 * `ref` (DECISIONS.md D-040). State is on React Aria's data attributes:
 * `data-selected`, `data-hovered`, `data-focus-visible`, `data-disabled`,
 * `data-sort-direction`, `data-resizing`, `data-expanded`, `data-level`.
 *
 * Web interpretation, not a port. Deviations: no editing of a cell in place,
 * and no expanding of every level with a modified click; a selected row is
 * highlighted, with no checkbox column drawn by the library yet; text is cut at
 * the end, not in the middle. Reordering rows passes through React Aria's
 * `dragAndDropHooks` with no handle and no non-drag alternative of ours.
 *
 * @example
 * <Table aria-label="Files" sortDescriptor={sort} onSortChange={setSort}>
 *   <TableHeader>
 *     <Column id="name" isRowHeader allowsSorting>Name</Column>
 *     <Column id="size" allowsSorting>Size</Column>
 *   </TableHeader>
 *   <TableBody>
 *     <Row id="a"><Cell>Report</Cell><Cell>24 KB</Cell></Row>
 *   </TableBody>
 * </Table>
 */
export function Table({ striped = false, className, ref, ...props }: TableProps) {
  return (
    <AriaTable
      {...props}
      ref={ref}
      data-striped={striped ? "" : undefined}
      className={composeRenderProps(className, (value) => styles.root({ className: value }))}
    />
  );
}

export interface TableHeaderProps<T extends object> extends AriaTableHeaderProps<T> {
  ref?: Ref<HTMLTableSectionElement | HTMLDivElement>;
}

/** The row of column headings. Client Component (React Aria `TableHeader`). */
export function TableHeader<T extends object>({ className, ref, ...props }: TableHeaderProps<T>) {
  return (
    <AriaTableHeader
      {...props}
      ref={ref}
      className={composeRenderProps(className, (value) => styles.header({ className: value }))}
    />
  );
}

export interface ColumnProps extends Omit<AriaColumnProps, "children"> {
  /** The heading: a noun or short noun phrase in title-style capitalization (HIG). */
  children?: ReactNode;
  /**
   * Draws a handle on the trailing edge of the heading that resizes the column
   * by dragging. The table must then sit inside a `ResizableTableContainer`.
   * Known gap: there is no keyboard way to start resizing yet. React Aria's
   * keyboard path needs a control that calls `startResize`, which it puts in a
   * menu on the heading, and menus arrive in a later batch.
   */
  allowsResizing?: boolean;
  ref?: Ref<HTMLTableCellElement | HTMLDivElement>;
}

/**
 * One column heading. With `allowsSorting` it sorts on press and shows the
 * direction. Client Component (React Aria `Column`).
 */
export function Column({ children, allowsResizing = false, className, ref, ...props }: ColumnProps) {
  return (
    <AriaColumn
      {...props}
      ref={ref}
      className={composeRenderProps(className, (value) => styles.column({ className: value }))}
    >
      {({ allowsSorting }) => (
        <div className={styles.columnContent()}>
          {/*
            With a resizer in the heading, focus arriving on the heading goes to its first focusable
            child. That must be the label, not the resizer's hidden slider, or the arrow keys would
            start resizing the moment the heading is reached.
          */}
          <span tabIndex={allowsResizing ? -1 : undefined} className={styles.columnLabel()}>
            {children}
          </span>
          {allowsSorting ? <Icon name="chevron-up" className={styles.sortIndicator()} /> : null}
          {allowsResizing ? <ColumnResizer className={styles.resizer()} /> : null}
        </div>
      )}
    </AriaColumn>
  );
}

export interface TableBodyProps<T extends object> extends AriaTableBodyProps<T> {
  ref?: Ref<HTMLTableSectionElement | HTMLDivElement>;
}

/** The rows. Client Component (React Aria `TableBody`). */
export function TableBody<T extends object>({ className, renderEmptyState, ref, ...props }: TableBodyProps<T>) {
  return (
    <AriaTableBody
      {...props}
      ref={ref}
      renderEmptyState={
        renderEmptyState ? (renderProps) => <div className={styles.empty()}>{renderEmptyState(renderProps)}</div> : undefined
      }
      className={composeRenderProps(className, (value) => styles.body({ className: value }))}
    />
  );
}

export interface RowProps<T extends object> extends AriaRowProps<T> {
  ref?: Ref<HTMLTableRowElement | HTMLDivElement>;
}

/**
 * One row. In a table with `treeColumn`, child rows go after its cells.
 * Client Component (React Aria `Row`).
 */
export function Row<T extends object>({ className, ref, ...props }: RowProps<T>) {
  return (
    <AriaRow
      {...props}
      ref={ref}
      className={composeRenderProps(className, (value) => styles.row({ className: value }))}
    />
  );
}

export interface CellProps extends Omit<AriaCellProps, "children"> {
  children?: ReactNode;
  ref?: Ref<HTMLTableCellElement | HTMLDivElement>;
}

/**
 * One cell. In the tree column it indents by the level of its row and draws
 * the disclosure triangle of a row that has children.
 * Client Component (React Aria `Cell`).
 */
export function Cell({ children, className, ref, ...props }: CellProps) {
  return (
    <AriaCell
      {...props}
      ref={ref}
      className={composeRenderProps(className, (value) => styles.cell({ className: value }))}
    >
      {({ isTreeColumn, hasChildItems }) =>
        isTreeColumn ? (
          <div className={styles.cellContent()}>
            {hasChildItems ? (
              <Button slot="chevron" className={styles.chevron()}>
                <Icon name="chevron-forward" className={styles.chevronGlyph()} />
              </Button>
            ) : (
              <span aria-hidden="true" className={styles.chevronSpacer()} />
            )}
            <span className={styles.cellLabel()}>{children}</span>
          </div>
        ) : (
          children
        )
      }
    </AriaCell>
  );
}

export interface ResizableTableContainerProps extends AriaResizableTableContainerProps {
  ref?: Ref<HTMLDivElement>;
}

/**
 * The scrolling element a table with resizable columns sits in. It measures
 * the width the columns share. Client Component (React Aria `ResizableTableContainer`).
 */
export function ResizableTableContainer({ className, ref, ...props }: ResizableTableContainerProps) {
  return <AriaResizableTableContainer {...props} ref={ref} className={cn(styles.container(), className)} />;
}
