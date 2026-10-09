import "vitest";

interface AxeMatchers<R = unknown> {
  /** Passes when an axe result has no violations. Registered in setup.ts. */
  toHaveNoViolations(): R;
}

declare module "vitest" {
  // The parameter name and default must match Vitest's own declaration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends AxeMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
