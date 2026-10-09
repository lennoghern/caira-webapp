import { tv } from "../../foundations/utils/tv";

/**
 * Class names for the three parts of a box. Server-safe.
 *
 * The frame (the filled, bordered shape) is the same recipe on both densities
 * but a different element draws it: macOS frames the content and leaves the
 * title above it, iOS frames the whole box with the title inside. So the frame
 * classes appear twice, once per platform variant.
 *
 * VERIFIED (HIG Boxes): a visible border or background color; on macOS the title
 * is displayed above the box; iOS and iPadOS use the secondary and tertiary
 * background colors.
 * INFERRED: the title text style, the padding, the radius (`--radius-box`), the
 * hairline border, the same two backgrounds on macOS, and the title inside the
 * box on iOS.
 */
export const box = tv({
  slots: {
    // A box paints an opaque background, so it also states the text color that goes with it.
    root: [
      "flex min-w-0 flex-col text-label",
      "platform-ios:rounded-box platform-ios:border platform-ios:border-separator platform-ios:p-4",
      "platform-ios:bg-background-secondary platform-ios:in-data-box-content:bg-background-tertiary",
    ],
    title: "mb-1.5 ps-3 text-headline platform-ios:mb-2 platform-ios:ps-0",
    content: [
      "min-w-0",
      "platform-macos:rounded-box platform-macos:border platform-macos:border-separator platform-macos:p-3",
      "platform-macos:bg-background-secondary platform-macos:in-data-box-content:bg-background-tertiary",
    ],
  },
});
