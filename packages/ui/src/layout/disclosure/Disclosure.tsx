"use client";

import { createContext, use, type ReactNode, type Ref } from "react";
import {
  Button,
  composeRenderProps,
  Disclosure as AriaDisclosure,
  DisclosureGroup as AriaDisclosureGroup,
  DisclosureGroupStateContext,
  DisclosurePanel as AriaDisclosurePanel,
  Heading,
  type ButtonProps,
  type DisclosureGroupProps as AriaDisclosureGroupProps,
  type DisclosurePanelProps as AriaDisclosurePanelProps,
  type DisclosureProps as AriaDisclosureProps,
} from "react-aria-components";
import { Icon } from "../../foundations/icon/Icon";
import { disclosure } from "./disclosure.styles";

export type DisclosureVariant = "triangle" | "button";

const VariantContext = createContext<DisclosureVariant>("triangle");

export interface DisclosureProps extends AriaDisclosureProps {
  /**
   * `triangle` (default): a triangle before a label that shows and hides
   * content related to a view or a list. `button`: a small button that points
   * down and shows and hides functionality related to one control; place it
   * next to that control and use no more than one in a view (HIG).
   */
  variant?: DisclosureVariant;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A disclosure control: it reveals and hides information and functionality
 * related to a view or to a control. Compose it from `DisclosureTrigger` and
 * `DisclosurePanel`; group several in a `DisclosureGroup`.
 *
 * Client Component: it is React Aria's `Disclosure`, which holds the expanded
 * state and handles the press.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/disclosure-controls
 * Apple API: SwiftUI `DisclosureGroup`, AppKit `NSButton.BezelStyle.disclosure`
 * (the triangle) and `.pushDisclosure` (the button).
 *
 * Accessibility: the APG Disclosure pattern,
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/ . The trigger is a button
 * with `aria-expanded` and `aria-controls`; the panel is a `group` named by the
 * trigger, hidden from everyone while collapsed.
 * Keyboard: Enter or Space on the trigger shows or hides the content; focus
 * stays on the trigger. Tab moves on, into the content when it is shown.
 *
 * Platform: none. The minimum height of the trigger follows the density.
 *
 * Styling: compound parts, each a named export with its own `className`
 * (DECISIONS.md D-040). State is on React Aria's data attributes:
 * `data-expanded`, `data-disabled`, `data-focus-visible-within`.
 *
 * Web interpretation, not a port. Deviations: collapsed content stays in the
 * page with `hidden="until-found"`, so the browser's find-in-page can open it,
 * which no Apple platform does; the triangle is a chevron glyph from the icon
 * registry, not a filled triangle.
 *
 * @example
 * <Disclosure>
 *   <DisclosureTrigger>Advanced options</DisclosureTrigger>
 *   <DisclosurePanel>…</DisclosurePanel>
 * </Disclosure>
 */
export function Disclosure({ variant = "triangle", className, ref, ...props }: DisclosureProps) {
  const styles = disclosure({ variant });
  return (
    <VariantContext value={variant}>
      <AriaDisclosure
        {...props}
        ref={ref}
        data-variant={variant}
        className={composeRenderProps(className, (value) => styles.root({ className: value }))}
      />
    </VariantContext>
  );
}

export interface DisclosureTriggerProps extends Omit<ButtonProps, "slot" | "children"> {
  /**
   * The label: say what is shown or hidden, like "Advanced options" (HIG). The
   * `button` variant may leave it out, and then needs an `aria-label`.
   */
  children?: ReactNode;
  /**
   * Wraps the trigger in a heading of this level. Inside a `DisclosureGroup`
   * the default is 3, as the APG Accordion pattern asks; alone there is no
   * heading unless one is asked for.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * The control of a `Disclosure`: a button with the glyph that shows the state,
 * and the label next to it.
 *
 * Client Component (React Aria `Button`, in the `trigger` slot of the disclosure).
 */
export function DisclosureTrigger({ children, headingLevel, className, ref, ...props }: DisclosureTriggerProps) {
  const variant = use(VariantContext);
  const inGroup = use(DisclosureGroupStateContext) !== null;
  const styles = disclosure({ variant });
  const level = headingLevel ?? (inGroup ? 3 : undefined);

  const button = (
    <Button
      {...props}
      ref={ref}
      slot="trigger"
      className={composeRenderProps(className, (value) => styles.trigger({ className: value }))}
    >
      <Icon name={variant === "button" ? "chevron-down" : "chevron-forward"} className={styles.glyph()} />
      {children != null && children !== false && children !== "" ? <span className={styles.label()}>{children}</span> : null}
    </Button>
  );

  return level ? (
    <Heading level={level} className={styles.heading()}>
      {button}
    </Heading>
  ) : (
    button
  );
}

export interface DisclosurePanelProps extends Omit<AriaDisclosurePanelProps, "className" | "style" | "render"> {
  /**
   * Classes for the element around `children`: its layout and padding. The
   * element above it is the clip the change of height needs and takes none.
   */
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The content a `Disclosure` shows and hides. The view grows and shrinks to
 * fit it; with reduced motion the change is immediate.
 *
 * Client Component (React Aria `DisclosurePanel`).
 */
export function DisclosurePanel({ children, className, ref, ...props }: DisclosurePanelProps) {
  const styles = disclosure({ variant: use(VariantContext) });
  return (
    <AriaDisclosurePanel {...props} ref={ref} className={styles.panel()}>
      <div data-disclosure-content="" className={styles.content({ className })}>
        {children}
      </div>
    </AriaDisclosurePanel>
  );
}

export interface DisclosureGroupProps extends AriaDisclosureGroupProps {
  ref?: Ref<HTMLDivElement>;
}

/**
 * Several disclosures that belong together, one open at a time unless
 * `allowsMultipleExpanded` is set. Each `Disclosure` inside takes an `id`
 * matching `expandedKeys`.
 *
 * Client Component (React Aria `DisclosureGroup`).
 *
 * Accessibility: the APG Accordion pattern,
 * https://www.w3.org/WAI/ARIA/apg/patterns/accordion/ . Each trigger sits in a
 * heading (level 3 unless `headingLevel` says otherwise).
 * Keyboard: as `Disclosure`. Tab moves from one trigger to the next.
 */
export function DisclosureGroup({ className, ref, ...props }: DisclosureGroupProps) {
  const styles = disclosure();
  return (
    <AriaDisclosureGroup
      {...props}
      ref={ref}
      className={composeRenderProps(className, (value) => styles.group({ className: value }))}
    />
  );
}
