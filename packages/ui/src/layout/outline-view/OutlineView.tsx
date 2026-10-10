"use client";

import type { ReactNode, Ref } from "react";
import {
  Button,
  composeRenderProps,
  Tree,
  TreeItem,
  TreeItemContent,
  type TreeItemProps,
  type TreeProps,
} from "react-aria-components";
import { Icon } from "../../foundations/icon/Icon";
import { outlineView } from "./outline-view.styles";

const styles = outlineView();

export interface OutlineViewProps<T extends object> extends TreeProps<T> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * An outline view: hierarchical data in a scrolling list of rows, where parent
 * rows open with a disclosure triangle to show their children. This is the
 * one-column form; compose it from nested `OutlineItem`s. For further columns
 * of attributes, use `Table` with `treeColumn`, which is the same pattern with
 * headings.
 *
 * Client Component: it is React Aria's `Tree`, which holds focus, selection and
 * expansion.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/outline-views
 * Apple API: SwiftUI `OutlineGroup`, AppKit `NSOutlineView`.
 *
 * Accessibility: the APG Treegrid pattern,
 * https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/ . React Aria builds its
 * tree as a `treegrid` of `row` elements with one `gridcell` each, not as the
 * `tree` of the APG Tree View pattern, so that a row may hold controls of its
 * own. Rows carry `aria-level`, `aria-posinset`, `aria-setsize` and, when they
 * have children, `aria-expanded`. Give the outline an `aria-label`.
 * Keyboard: the outline is one tab stop. Up and Down move between visible rows;
 * Home and End go to the first and last. Right opens a closed row; Left closes
 * an open row, and on a row that is closed or has no children moves to its
 * parent. Typing moves to the row that starts with what was typed. Space
 * selects; Enter performs the row's action, or selects when it has none.
 *
 * Platform: macOS only on Apple's side. The height of a row follows the density.
 *
 * HIG guidance worth keeping in mind: use it for text, usually on the leading
 * side of a split view; keep the expansion state between visits
 * (`expandedKeys` and `onExpandedChange` are there for that); use a table when
 * the data is not hierarchical.
 *
 * Styling: compound parts, each a named export with its own `className` and
 * `ref` (DECISIONS.md D-040). State is on React Aria's data attributes:
 * `data-expanded`, `data-has-child-items`, `data-level`, `data-selected`,
 * `data-hovered`, `data-focus-visible`, `data-disabled`.
 *
 * Web interpretation, not a port. Deviations: a modified click on a triangle
 * does not expand every level under it; no editing of a row in place; Right on
 * an open row stays on it (React Aria 1.22.0), where the APG Tree View pattern
 * moves to the first child, which Down reaches. Reordering passes through React
 * Aria's `dragAndDropHooks` with no handle and no non-drag alternative of ours.
 *
 * @example
 * <OutlineView aria-label="Files" defaultExpandedKeys={["documents"]}>
 *   <OutlineItem id="documents" title="Documents">
 *     <OutlineItem id="report" title="Report" />
 *   </OutlineItem>
 * </OutlineView>
 */
export function OutlineView<T extends object>({ className, renderEmptyState, ref, ...props }: OutlineViewProps<T>) {
  return (
    <Tree
      {...props}
      ref={ref}
      renderEmptyState={
        renderEmptyState ? (renderProps) => <div className={styles.empty()}>{renderEmptyState(renderProps)}</div> : undefined
      }
      className={composeRenderProps(className, (value) => styles.root({ className: value }))}
    />
  );
}

export interface OutlineItemProps<T extends object = object> extends Omit<TreeItemProps<T>, "children" | "textValue"> {
  /** What the row shows. Keep it to text: an outline view is for text-based content (HIG). */
  title: ReactNode;
  /** A small image before the title, usually an `<Icon />`. Decoration. */
  icon?: ReactNode;
  /**
   * The row as plain text, for typeahead and for its accessible name. Needed
   * when `title` is not a string.
   */
  textValue?: string;
  /** The rows nested under this one: more `OutlineItem`s, or a React Aria `Collection`. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * One row of an `OutlineView`, with the rows under it as children.
 * Client Component (React Aria `TreeItem`).
 */
export function OutlineItem<T extends object = object>({
  title,
  icon,
  textValue,
  children,
  className,
  ref,
  ...props
}: OutlineItemProps<T>) {
  return (
    <TreeItem
      {...props}
      ref={ref}
      textValue={textValue ?? (typeof title === "string" ? title : "")}
      className={composeRenderProps(className, (value) => styles.item({ className: value }))}
    >
      <TreeItemContent>
        {({ hasChildItems }) => (
          <span className={styles.content()}>
            {hasChildItems ? (
              <Button slot="chevron" className={styles.chevron()}>
                <Icon name="chevron-forward" className={styles.chevronGlyph()} />
              </Button>
            ) : (
              <span aria-hidden="true" className={styles.chevronSpacer()} />
            )}
            {icon != null && icon !== false ? <span className={styles.icon()}>{icon}</span> : null}
            <span className={styles.title()}>{title}</span>
          </span>
        )}
      </TreeItemContent>
      {children}
    </TreeItem>
  );
}
