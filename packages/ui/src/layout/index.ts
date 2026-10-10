/**
 * @caira/ui/layout: the HIG "Layout and organization" components.
 *
 * This barrel carries no "use client" directive on purpose: each file decides
 * for itself, so the server-safe exports stay usable from Server Components.
 *
 *   Server-safe          Box, Label
 *   Client Components    CollectionView, CollectionItem
 *                        ColumnView
 *                        Disclosure, DisclosureTrigger, DisclosurePanel, DisclosureGroup
 *                        List, ListItem, ListSection, ListHeader
 *                        Table, TableHeader, Column, TableBody, Row, Cell, ResizableTableContainer
 *                        Lockup
 *                        OutlineView, OutlineItem
 *                        SplitView, SplitViewPane
 *                        Tabs, TabList, Tab, TabPanels, TabPanel
 *
 * HIG page to export: Boxes: Box. Collections: CollectionView. Column views:
 * ColumnView. Disclosure controls: Disclosure. Labels: Label. Lists and tables:
 * List, Table. Lockups: Lockup. Outline views: OutlineView, and Table with
 * `treeColumn` for several columns. Split views: SplitView. Tab views: Tabs.
 */
export * from "./box";
export * from "./collection-view";
export * from "./column-view";
export * from "./disclosure";
export * from "./label";
export * from "./list";
export * from "./lockup";
export * from "./outline-view";
export * from "./split-view";
export * from "./table";
export * from "./tabs";
