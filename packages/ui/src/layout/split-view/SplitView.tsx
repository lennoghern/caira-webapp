"use client";

import { createContext, use, useId, useState, type HTMLAttributes, type Ref } from "react";
import { cn } from "../../foundations/utils/cn";
import { useResizeHandle } from "../shared/useResizeHandle";
import { splitView } from "./split-view.styles";

export type SplitViewOrientation = "horizontal" | "vertical";
export type SplitViewDividerStyle = "thin" | "thick";

interface SplitViewContextValue {
  orientation: SplitViewOrientation;
  dividerStyle: SplitViewDividerStyle;
}

const SplitViewContext = createContext<SplitViewContextValue>({ orientation: "horizontal", dividerStyle: "thin" });

export interface SplitViewProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `horizontal` (default): the panes sit side by side, in reading order.
   * `vertical`: they are stacked. Nest a split view in a pane to get both.
   */
  orientation?: SplitViewOrientation;
  /**
   * `thin` (default): a line one pixel wide, which the HIG prefers. `thick`: a
   * bar with a grip, for where a thin line would be hard to see, such as
   * between two tables.
   */
  dividerStyle?: SplitViewDividerStyle;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A split view: several adjacent panes of content, with dividers that people
 * drag to resize them. Compose it from `SplitViewPane`s: give a size and a
 * `divider` to the panes people can resize, and neither to the pane that takes
 * the rest of the space.
 *
 * Client Component: a pane keeps its size and whether it is collapsed, and the
 * divider handles pointer and keyboard.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/split-views
 * Apple API: SwiftUI `NavigationSplitView`, `HSplitView` and `VSplitView`,
 * UIKit `UISplitViewController`, AppKit `NSSplitViewController` and
 * `NSSplitView.DividerStyle`.
 *
 * Accessibility: the APG Window Splitter pattern,
 * https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/ . Each divider is a
 * focusable `separator` that controls the pane it belongs to and carries that
 * pane's name, with the pane's size in CSS pixels as its value (0 while the
 * pane is collapsed). A pane with a divider needs an `aria-label` or
 * `aria-labelledby`; it becomes a `group` with that name.
 * Keyboard: Tab reaches each divider. Left and Right move the divider of side
 * by side panes, Up and Down the divider of stacked panes, by `keyboardStep`.
 * Home and End go to the smallest and the largest size. Enter collapses a
 * `collapsible` pane and restores it to the size it had.
 * Without dragging (WCAG 2.2 2.5.7): a double click returns a pane to its
 * default size, and `collapsed` lets a button elsewhere hide and show a pane.
 *
 * Platform: none. On Apple's side the dividers are a macOS trait; iPadOS and
 * visionOS split views change their layout with the width of the window, which
 * here is the caller's job.
 *
 * HIG guidance worth keeping in mind: set minimum and maximum sizes so a
 * divider stays visible; when a pane can be hidden, give more than one way to
 * bring it back (a toolbar button, a menu command); keep the selection of a
 * pane that leads to another highlighted.
 *
 * Styling: compound parts, each a named export with its own `className` and
 * `ref` (DECISIONS.md D-040). The divider is drawn by its pane and is reached
 * through `[data-split-view-divider]`; it carries `data-dragging` while it is
 * dragged, and a pane carries `data-collapsed`.
 *
 * Web interpretation, not a port. Deviations: sizes are in CSS pixels and are
 * not remembered, so persisting them is the caller's job through `size` and
 * `onSizeChange`; the pattern's optional F6 (cycle through the panes) is left
 * to the application; the layout does not rearrange itself at narrow widths.
 * Known gaps: the thin divider takes the pointer on a strip 13 px wide, under
 * the 24 px of WCAG 2.2 2.5.8, and at rest its line has less than 3:1 against
 * the panes, as a hairline does; `dividerStyle="thick"` has a grip that reaches
 * 3:1.
 *
 * @example
 * <SplitView className="h-96">
 *   <SplitViewPane aria-label="Mailboxes" divider="end" defaultSize={220} collapsible>…</SplitViewPane>
 *   <SplitViewPane>…</SplitViewPane>
 * </SplitView>
 */
export function SplitView({ orientation = "horizontal", dividerStyle = "thin", className, ref, ...props }: SplitViewProps) {
  const styles = splitView({ orientation, dividerStyle });
  return (
    <SplitViewContext value={{ orientation, dividerStyle }}>
      <div {...props} ref={ref} data-split-view="" data-orientation={orientation} className={styles.root({ className })} />
    </SplitViewContext>
  );
}

export interface SplitViewPaneProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The edge of this pane that carries its divider: `end` for a pane before the
   * flexible one (a sidebar), `start` for a pane after it (an inspector).
   * Without it the pane has no size of its own and takes the space left over.
   */
  divider?: "start" | "end";
  /** The size along the split, in CSS px (controlled). */
  size?: number;
  /** The size the pane starts with, and the one a double click on the divider returns to. Default 240. */
  defaultSize?: number;
  /** Called with the new size while the divider moves. */
  onSizeChange?: (size: number) => void;
  /** The smallest size the divider allows. Default 120. */
  minSize?: number;
  /** The largest size the divider allows. Default 480. */
  maxSize?: number;
  /**
   * Lets the pane be hidden: with Enter on the divider, or by dragging the
   * divider past half of the minimum size.
   */
  collapsible?: boolean;
  /** Whether the pane is hidden (controlled). */
  collapsed?: boolean;
  /** Whether the pane starts hidden. */
  defaultCollapsed?: boolean;
  /** Called when the pane is hidden or shown. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** How far one arrow key press moves the divider, in CSS px. Default 16. */
  keyboardStep?: number;
  ref?: Ref<HTMLDivElement>;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * One pane of a `SplitView`. With `divider` it has a size that people change;
 * without, it fills what is left. Client Component.
 */
export function SplitViewPane({
  divider,
  size: sizeProp,
  defaultSize = 240,
  onSizeChange,
  minSize = 120,
  maxSize = 480,
  collapsible = false,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  keyboardStep = 16,
  id: idProp,
  className,
  style,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: SplitViewPaneProps) {
  const { orientation, dividerStyle } = use(SplitViewContext);
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const [sizeState, setSizeState] = useState(() => clamp(defaultSize, minSize, maxSize));
  const [collapsedState, setCollapsedState] = useState(defaultCollapsed);
  const size = clamp(sizeProp ?? sizeState, minSize, maxSize);
  const collapsed = collapsible && (collapsedProp ?? collapsedState);

  const setSize = (next: number) => {
    if (sizeProp === undefined) setSizeState(next);
    if (next !== size) onSizeChange?.(next);
  };
  const setCollapsed = (next: boolean) => {
    if (next === collapsed) return;
    if (collapsedProp === undefined) setCollapsedState(next);
    onCollapsedChange?.(next);
  };

  const { handleProps } = useResizeHandle({
    size: collapsed ? 0 : size,
    minSize: collapsible ? 0 : minSize,
    maxSize,
    axis: orientation === "horizontal" ? "inline" : "block",
    edge: divider ?? "end",
    step: keyboardStep,
    onResize: (requested) => {
      // INFERRED threshold: under half of the minimum the pane is hidden, over it it is shown at least at the minimum.
      if (collapsible && requested < minSize / 2) {
        setCollapsed(true);
        return;
      }
      setCollapsed(false);
      setSize(Math.round(clamp(requested, minSize, maxSize)));
    },
    onToggle: collapsible ? () => setCollapsed(!collapsed) : undefined,
    onReset: () => {
      setCollapsed(false);
      setSize(clamp(defaultSize, minSize, maxSize));
    },
  });

  const sized = divider !== undefined;
  const styles = splitView({ orientation, dividerStyle, sized });
  const named = ariaLabel !== undefined || ariaLabelledBy !== undefined;

  const handle = sized ? (
    <div
      {...handleProps}
      aria-controls={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-split-view-divider=""
      className={styles.divider()}
    >
      {dividerStyle === "thick" ? <span className={styles.grip()} /> : null}
    </div>
  ) : null;

  return (
    <>
      {divider === "start" ? handle : null}
      <div
        {...props}
        ref={ref}
        id={id}
        // A name on an element with no role is not announced; a named pane is a group.
        role={named ? "group" : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        hidden={collapsed || undefined}
        data-split-view-pane=""
        data-collapsed={collapsed ? "" : undefined}
        className={cn(styles.pane(), className)}
        style={sized ? { ...style, flexBasis: size } : style}
      />
      {divider === "end" ? handle : null}
    </>
  );
}
