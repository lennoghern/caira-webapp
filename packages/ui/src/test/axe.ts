import { configureAxe } from "jest-axe";

/**
 * axe for unit tests of a single component.
 *
 * What this proves: the rules that need no layout (names, roles, ARIA
 * relationships, nesting). What it cannot prove: color contrast and anything
 * else that depends on rendering. jsdom computes no layout and no colors, and
 * jest-axe turns the color rules off for that reason.
 *
 * `region` is off because a component rendered alone is, correctly, not inside
 * a page landmark.
 */
export const axe = configureAxe({
  rules: {
    region: { enabled: false },
  },
});
