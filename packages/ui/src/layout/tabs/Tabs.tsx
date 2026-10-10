"use client";

import type { ReactNode, Ref } from "react";
import {
  composeRenderProps,
  SelectionIndicator,
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  TabPanels as AriaTabPanels,
  Tabs as AriaTabs,
  type TabListProps as AriaTabListProps,
  type TabPanelProps as AriaTabPanelProps,
  type TabPanelsProps as AriaTabPanelsProps,
  type TabProps as AriaTabProps,
  type TabsProps as AriaTabsProps,
} from "react-aria-components";
import { cn } from "../../foundations/utils/cn";
import { tabs } from "./tabs.styles";

const styles = tabs();

export interface TabsProps extends AriaTabsProps {
  ref?: Ref<HTMLDivElement>;
}

/**
 * A tab view: several mutually exclusive panes of closely related content in
 * the same area, switched with a tabbed control. Compose it from `TabList`,
 * `Tab` and `TabPanel` (optionally inside `TabPanels`).
 *
 * Client Component: it is React Aria's `Tabs`, which holds the selection and
 * moves focus.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/tab-views
 * Apple API: SwiftUI `TabView`, AppKit `NSTabView`.
 *
 * Accessibility: the APG Tabs pattern,
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ . A `tablist` of `tab`
 * elements, each controlling a `tabpanel` named by its tab. Give the `TabList`
 * an `aria-label`.
 * Keyboard: Tab enters the list on the selected tab and leaves it into the
 * pane. Left and Right (Up and Down when vertical) move to the previous or
 * next tab, wrapping, and select it; Home and End go to the first and last.
 * With `keyboardActivation="manual"` the arrows only move focus, and Enter or
 * Space selects.
 *
 * Platform: Apple offers tab views on macOS (and as page controls on watchOS);
 * on iOS and iPadOS the HIG points to a segmented control. Here the component
 * works at both densities and only its heights change.
 *
 * HIG guidance worth keeping in mind: no more than six tabs; controls in a pane
 * affect only that pane; inset the tab view from the edges of its window.
 *
 * Styling: compound parts, each a named export with its own `className` and
 * `ref` (DECISIONS.md D-040). State is on React Aria's data attributes:
 * `data-selected`, `data-hovered`, `data-pressed`, `data-focus-visible`,
 * `data-disabled`, `data-orientation`.
 *
 * Web interpretation, not a port. Deviations: hiding the tabbed control and the
 * borderless and bezeled content styles of `NSTabView` are not offered (give
 * `TabPanel` a class to change its frame); the control can sit on the leading
 * side with `orientation="vertical"`, not on the bottom or trailing edge; the
 * look of the macOS 27 tabs picker style is not reproduced.
 *
 * @example
 * <Tabs>
 *   <TabList aria-label="Display settings">
 *     <Tab id="display">Display</Tab>
 *     <Tab id="color">Color</Tab>
 *   </TabList>
 *   <TabPanel id="display">…</TabPanel>
 *   <TabPanel id="color">…</TabPanel>
 * </Tabs>
 */
export function Tabs({ className, ref, ...props }: TabsProps) {
  return (
    <AriaTabs
      {...props}
      ref={ref}
      className={composeRenderProps(className, (value) => styles.root({ className: value }))}
    />
  );
}

export interface TabListProps<T extends object> extends AriaTabListProps<T> {
  ref?: Ref<HTMLDivElement>;
}

/** The tabbed control: the row (or column) of tabs. Client Component (React Aria `TabList`). */
export function TabList<T extends object>({ className, ref, ...props }: TabListProps<T>) {
  return (
    <AriaTabList
      {...props}
      ref={ref}
      className={composeRenderProps(className, (value) => styles.list({ className: value }))}
    />
  );
}

export interface TabProps extends Omit<AriaTabProps, "children"> {
  /** The label: a noun or short noun phrase that says what the pane holds (HIG). */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * One tab. With `href` it is a link that the router follows.
 * Client Component (React Aria `Tab`).
 */
export function Tab({ children, className, ref, ...props }: TabProps) {
  return (
    <AriaTab
      {...props}
      ref={ref}
      className={composeRenderProps(className, (value) => styles.tab({ className: value }))}
    >
      <SelectionIndicator className={styles.indicator()} />
      <span className={styles.label()}>
        <span className={styles.labelText()}>{children}</span>
        <span aria-hidden="true" className={styles.labelGhost()}>
          {children}
        </span>
      </span>
    </AriaTab>
  );
}

export interface TabPanelsProps<T extends object> extends AriaTabPanelsProps<T> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * Optional wrapper around the panes. React Aria sets `--tab-panel-width` and
 * `--tab-panel-height` on it while the selection changes, for a caller that
 * wants to animate the size of the content area.
 * Client Component (React Aria `TabPanels`).
 */
export function TabPanels<T extends object>({ className, ref, ...props }: TabPanelsProps<T>) {
  return <AriaTabPanels {...props} ref={ref} className={cn(styles.panels(), className)} />;
}

export interface TabPanelProps extends AriaTabPanelProps {
  ref?: Ref<HTMLDivElement>;
}

/**
 * One pane of content, framed. It is a tab stop of its own when nothing inside
 * it can take focus. Client Component (React Aria `TabPanel`).
 */
export function TabPanel({ className, ref, ...props }: TabPanelProps) {
  return (
    <AriaTabPanel
      {...props}
      ref={ref}
      className={composeRenderProps(className, (value) => styles.panel({ className: value }))}
    />
  );
}
