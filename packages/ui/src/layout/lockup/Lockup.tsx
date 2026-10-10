"use client";

import type { ReactNode, Ref } from "react";
import { Button, composeRenderProps, Link, type ButtonProps, type LinkProps } from "react-aria-components";
import { material } from "../../foundations/materials/Material";
import { cn } from "../../foundations/utils/cn";
import { lockup } from "./lockup.styles";

export type LockupVariant = "card" | "caption" | "monogram" | "poster";

/*
 * Between the views. The lockup is one button or link, so its views are spans, and the accessible
 * name of a control joins the text of inline elements with nothing in between. A browser adds the
 * space when CSS makes them blocks; a text node makes the name right whatever the CSS says. It adds
 * nothing on screen: a flex container drops it and a block collapses it.
 */
const SPACE = " ";

type Shared = "className" | "children" | "style" | "render";

interface LockupOwnProps {
  /**
   * `caption` (default): an image or text with a title and subtitle beneath.
   * `card`: header, content and footer in a framed shape, for ratings and
   * reviews. `monogram`: a circular picture of a person and their name.
   * `poster`: an image whose title and subtitle show when it gets focus.
   */
  variant?: LockupVariant;
  /** Shown above the content view. */
  header?: ReactNode;
  /** The content view: usually an image. In a monogram, the person's picture. */
  children?: ReactNode;
  /** First line of the footer, below the content view. */
  title?: ReactNode;
  /** Second line of the footer. */
  subtitle?: ReactNode;
  /**
   * Monogram only: shown in place of the picture when there is none. The HIG
   * prefers a picture. Not read out: the name is in `title`.
   */
  initials?: string;
  /** Classes for the box of the lockup: its width, its place in a grid. */
  className?: string;
  /** Classes for the parts inside, merged over the library's own with the caller winning. */
  classNames?: {
    /** The header. Rendered only when there is one. */
    header?: string;
    /** The content view, around `children`. It clips to the shape of the variant. */
    content?: string;
    /** The footer, around the title and the subtitle. Rendered only when there is either. */
    footer?: string;
    title?: string;
    subtitle?: string;
  };
}

export type LockupProps = LockupOwnProps &
  (
    | (Omit<LinkProps, Shared> & { href: string; ref?: Ref<HTMLAnchorElement> })
    | (Omit<ButtonProps, Shared> & { href?: undefined; ref?: Ref<HTMLButtonElement> })
  );

/**
 * A lockup: several views (a header, a content view, a footer) combined into a
 * single interactive unit. It is one link, with `href`, or one button.
 *
 * Client Component: it is React Aria's `Link` or `Button`, which handle the
 * press.
 *
 * HIG: https://developer.apple.com/design/human-interface-guidelines/lockups
 * Apple API: TVUIKit `TVLockupView` and `TVLockupHeaderFooterView`, with
 * `TVCardView`, `TVCaptionButtonView`, `TVMonogramContentView` and
 * `TVPosterView` for the four types. tvOS only on Apple's side.
 *
 * Accessibility: the APG Link pattern with `href`,
 * https://www.w3.org/WAI/ARIA/apg/patterns/link/ , otherwise the APG Button
 * pattern, https://www.w3.org/WAI/ARIA/apg/patterns/button/ . Its name is its
 * text: header, title and subtitle, and the text alternative of an image
 * inside. Give an image that only repeats the title an empty `alt`. A poster's
 * title and subtitle are hidden from sight until hover or focus, never from
 * assistive technology.
 * Keyboard: Tab reaches the lockup. Enter follows a link; Enter or Space
 * presses a button.
 *
 * Platform: none.
 *
 * HIG guidance worth keeping in mind: leave room between lockups, because one
 * grows when it gets focus; keep the sizes in a row or group the same.
 *
 * Styling: one export that owns its three views, because where the footer sits
 * (under the content, or over it in a poster) depends on the variant
 * (DECISIONS.md D-040). `className` goes to the lockup itself; `classNames`
 * reaches the views. State is on React Aria's data attributes: `data-hovered`,
 * `data-pressed`, `data-focus-visible`, `data-disabled`.
 *
 * Web interpretation of a tvOS component, labelled as such: tvOS focus becomes
 * hover and keyboard focus, and the growth on focus a scale of 5%, turned off
 * under reduced motion. Deviations: a caption button does not tilt with a
 * swipe; a card has no rating control of its own.
 *
 * @example
 * <Lockup variant="poster" href="/films/1" title="The Long Road" subtitle="2024">
 *   <img src="…" alt="" />
 * </Lockup>
 *
 * @example
 * <Lockup variant="monogram" title="Ada Lovelace" initials="AL" onPress={showPerson} />
 */
export function Lockup({
  variant = "caption",
  header,
  children,
  title,
  subtitle,
  initials,
  className,
  classNames,
  ...props
}: LockupProps) {
  const styles = lockup({ variant });
  const shown = (node: ReactNode) => node != null && node !== false && node !== "";
  const hasContent = shown(children);
  const hasFooter = shown(title) || shown(subtitle);
  const footer = hasFooter ? (
    <span
      data-lockup-footer=""
      // A poster's caption sits on a standard material, the content layer's translucent background.
      {...(variant === "poster" ? { "data-material": "thin" } : null)}
      className={cn(variant === "poster" && material({ thickness: "thin" }), styles.footer({ className: classNames?.footer }))}
    >
      {shown(title) ? <span className={styles.title({ className: classNames?.title })}>{title}</span> : null}
      {SPACE}
      {shown(subtitle) ? <span className={styles.subtitle({ className: classNames?.subtitle })}>{subtitle}</span> : null}
    </span>
  ) : null;

  const views = (
    <>
      {shown(header) ? (
        <span data-lockup-header="" className={styles.header({ className: classNames?.header })}>
          {header}
        </span>
      ) : null}
      {SPACE}
      <span data-lockup-content="" className={styles.content({ className: classNames?.content })}>
        {hasContent ? (
          children
        ) : variant === "monogram" && initials ? (
          <span aria-hidden="true" className={styles.initials()}>
            {initials}
          </span>
        ) : null}
        {SPACE}
        {variant === "poster" ? footer : null}
      </span>
      {SPACE}
      {variant === "poster" ? null : footer}
    </>
  );

  const rootClassName = composeRenderProps(className, (value: string | undefined) => styles.root({ className: value }));

  if (props.href !== undefined) {
    return (
      <Link {...props} data-lockup={variant} className={rootClassName}>
        {views}
      </Link>
    );
  }
  return (
    <Button {...props} data-lockup={variant} className={rootClassName}>
      {views}
    </Button>
  );
}
