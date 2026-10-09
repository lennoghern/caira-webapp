/**
 * jest-axe 11 ships no type definitions. These cover the parts the tests use.
 */
declare module "jest-axe" {
  export interface AxeNodeResult {
    html: string;
    target: unknown[];
    failureSummary?: string;
  }

  export interface AxeRuleResult {
    id: string;
    impact?: "minor" | "moderate" | "serious" | "critical" | null;
    help: string;
    helpUrl: string;
    nodes: AxeNodeResult[];
  }

  export interface AxeResults {
    violations: AxeRuleResult[];
    incomplete: AxeRuleResult[];
    passes: AxeRuleResult[];
    inapplicable: AxeRuleResult[];
  }

  export interface AxeRunOptions {
    rules?: Record<string, { enabled: boolean }>;
    runOnly?: string[] | { type: "tag" | "rule"; values: string[] };
  }

  export interface ConfigureAxeOptions extends AxeRunOptions {
    globalOptions?: Record<string, unknown>;
    impactLevels?: NonNullable<AxeRuleResult["impact"]>[];
  }

  export type AxeRunner = (html: Element | string, options?: AxeRunOptions) => Promise<AxeResults>;

  export function configureAxe(options?: ConfigureAxeOptions): AxeRunner;
  export const axe: AxeRunner;
  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): { pass: boolean; message: () => string };
  };
}
