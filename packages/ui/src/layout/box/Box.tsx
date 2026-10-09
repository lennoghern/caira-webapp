import { useId, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { box } from "./box.styles";

export interface BoxProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "role"> {
  /**
   * A brief phrase saying what the contents have in common. It becomes the
   * accessible name of the group. Sentence-style capitalization and no ending
   * punctuation, except a colon in a settings pane (HIG Boxes).
   *
   * This replaces the HTML `title` attribute (a tooltip), which a box does not take.
   */
  title?: ReactNode;
  /**
   * `group` (default) for a set of related content. `region` makes the box a
   * landmark, listed among the page's regions: only for content important
   * enough to navigate to, and it then needs a `title` or an `aria-label`.
   */
  role?: "group" | "region";
  /** Classes for the parts inside the box. `className` goes to the box itself. */
  classNames?: {
    title?: string;
    /** The element around `children`. On macOS it is the frame, so padding overrides go here. */
    content?: string;
  };
  ref?: Ref<HTMLDivElement>;
}

/**
 * A box: a visually distinct group of related information and controls, with
 * an optional title. For the content layer; it is not glass.
 *
 * Server-safe: markup and class names, plus `useId` for the title, which React
 * allows in Server Components. It ships no client JavaScript.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/boxes
 * Apple API: SwiftUI `GroupBox` (`init(_:content:)`, `init(content:label:)`),
 * AppKit `NSBox` (`title`, `contentView`).
 *
 * Accessibility: a `group` named by its title (WAI-ARIA `group` role; the APG
 * has no pattern for it). `aria-label` or `aria-labelledby`, when given, name
 * the box instead of the title. With `role="region"` it follows the APG
 * Landmarks practice: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 * Keyboard: none. A box is not a tab stop and does not change the tab order of
 * what is inside it.
 *
 * Platform: at macOS density the title sits above the frame; at iOS density the
 * whole box is the filled shape and the title sits inside it. A box inside a
 * box takes the tertiary background.
 *
 * HIG guidance worth keeping in mind: keep a box small next to its container,
 * and group within a box with padding and alignment before nesting another box.
 *
 * Web interpretation, not a port. Deviations: there is no native `<fieldset>`
 * form, because a disabled fieldset disables the controls inside it without
 * React Aria knowing (DECISIONS.md D-039); `NSBox`'s `titlePosition`, `boxType`
 * and custom border and fill colors are not offered; and on glass or a
 * material the box stays opaque.
 *
 * @example
 * <Box title="Playback">
 *   <label><input type="checkbox" /> Crossfade between songs</label>
 * </Box>
 */
export function Box({
  title,
  role = "group",
  className,
  classNames,
  children,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: BoxProps) {
  const titleId = useId();
  const styles = box();
  const hasTitle = title != null && title !== false && title !== "";

  return (
    <div
      {...props}
      ref={ref}
      role={role}
      aria-label={ariaLabel}
      // An explicit name wins: `aria-labelledby` beats `aria-label` in the name
      // computation, so adding the title here would silently override the caller's label.
      aria-labelledby={ariaLabelledBy ?? (hasTitle && ariaLabel === undefined ? titleId : undefined)}
      data-box=""
      className={styles.root({ className })}
    >
      {hasTitle ? (
        <div id={titleId} className={styles.title({ className: classNames?.title })}>
          {title}
        </div>
      ) : null}
      {/* Nested boxes find this attribute on an ancestor and switch to the tertiary background. */}
      <div data-box-content="" className={styles.content({ className: classNames?.content })}>
        {children}
      </div>
    </div>
  );
}
