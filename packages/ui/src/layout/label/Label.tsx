import type { HTMLAttributes, ReactNode, Ref } from "react";
import { label } from "./label.styles";

export type LabelLevel = "primary" | "secondary" | "tertiary";

export type LabelTextStyle =
  | "large-title"
  | "title1"
  | "title2"
  | "title3"
  | "headline"
  | "body"
  | "callout"
  | "subheadline"
  | "footnote"
  | "caption1"
  | "caption2";

export interface LabelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** The text of the label. Keep it short: a label is for a small amount of text (HIG Labels). */
  children: ReactNode;
  /** An image that goes with the text, usually an `<Icon />`. Drawn before the text. */
  icon?: ReactNode;
  /**
   * Which of the two parts are shown. With `icon-only` the text is hidden from
   * sight but stays the accessible name of the label.
   */
  labelStyle?: "title-and-icon" | "title-only" | "icon-only";
  /**
   * Relative importance, through the label colors: `primary` for the main
   * information, `secondary` for a subheading or supplemental text, `tertiary`
   * for text that describes something unavailable.
   */
  level?: LabelLevel;
  /** One of the text styles of HIG Typography. Default `body`. */
  textStyle?: LabelTextStyle;
  /**
   * `true` lets people select and copy the text where an ancestor turned
   * selection off (a row, a button); `false` turns it off. Unset, the label
   * follows its container. Make useful text selectable: an error message, a
   * location, an address (HIG Labels).
   */
  selectable?: boolean;
  /** The most lines the text may take before it is cut with an ellipsis at the end. */
  lineLimit?: 1 | 2 | 3;
  /**
   * The element to render. `label` names a form control and takes `htmlFor`;
   * `span` (default) is inline text; `p` and `div` are blocks.
   */
  as?: "span" | "div" | "p" | "label";
  /** The id of the control this label names. Only with `as="label"`. */
  htmlFor?: string;
  /** Classes for the parts inside, merged over the library's own with the caller winning. */
  classNames?: {
    /** The wrapper around `icon`. Rendered only when there is an icon to show. */
    icon?: string;
    /** The element around `children`. It carries the truncation. */
    title?: string;
  };
  ref?: Ref<HTMLElement>;
}

/**
 * A label: a small amount of static text, optionally led by an icon, that
 * people can read and often copy but not edit.
 *
 * Server-safe: markup and class names, no hooks. It ships no client JavaScript.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/labels
 * Apple API: SwiftUI `Label` (title and icon) and `Text`, UIKit `UILabel`,
 * AppKit `NSTextField` with `isEditable` off.
 *
 * Accessibility: plain text; the APG has no pattern for it. With `as="label"`
 * and `htmlFor` it is the HTML label of a control and names it. The icon is
 * decoration: give it no label of its own, the text says what it means. With
 * `labelStyle="icon-only"` the text is kept for assistive technology.
 * Keyboard: none. A label is never a tab stop.
 *
 * Platform: the text styles and their sizes follow the density of the page
 * (tokens.css); nothing else differs.
 *
 * Styling: one export that owns its two parts, the icon and the title
 * (DECISIONS.md D-040). `className` goes to the label itself: margins,
 * placement, a width. `classNames.icon` and `classNames.title` reach the parts:
 * a color for the icon, a font weight for the title. The label is an inline
 * flex box, so it truncates only inside a container that limits its width.
 *
 * Web interpretation, not a port. Deviations: the quaternary label color is not
 * offered, because it has no contrast guarantee here and must not color text;
 * text is cut at the end only, with no middle ellipsis (CSS has none); the
 * watchOS date and timer text components are not part of this component. Form
 * fields built on React Aria name themselves with React Aria's own `Label`,
 * which reads their context; this component is for text outside of them.
 *
 * @example
 * <Label icon={<Icon name="info" />}>About this device</Label>
 *
 * @example
 * // Supplemental text, cut to one line, that people can copy.
 * <Label level="secondary" textStyle="callout" lineLimit={1} selectable>192.168.1.24</Label>
 */
export function Label({
  children,
  icon,
  labelStyle = "title-and-icon",
  level,
  textStyle,
  selectable,
  lineLimit,
  as: Element = "span",
  htmlFor,
  className,
  classNames,
  ref,
  ...props
}: LabelProps) {
  const selection = selectable === undefined ? undefined : selectable ? "on" : "off";
  const styles = label({ level, textStyle, selection, lineLimit, labelStyle });
  const showsIcon = icon != null && icon !== false && labelStyle !== "title-only";

  return (
    <Element
      {...props}
      // `for` only means something on a label; on the other elements it would be an unknown attribute.
      {...(Element === "label" ? { htmlFor } : null)}
      ref={ref as Ref<never>}
      data-label=""
      data-label-style={labelStyle}
      className={styles.root({ className })}
    >
      {showsIcon ? (
        <span data-label-icon="" className={styles.icon({ className: classNames?.icon })}>
          {icon}
        </span>
      ) : null}
      <span data-label-title="" className={styles.title({ className: classNames?.title })}>
        {children}
      </span>
    </Element>
  );
}
