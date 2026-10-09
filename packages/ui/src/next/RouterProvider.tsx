"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { RouterProvider as AriaRouterProvider } from "react-aria-components";

type NextRouterOptions = NonNullable<Parameters<ReturnType<typeof useRouter>["push"]>[1]>;

declare module "react-aria-components" {
  // Types the `routerOptions` prop of every React Aria link as Next's push options.
  interface RouterConfig {
    routerOptions: NextRouterOptions;
  }
}

export interface RouterProviderProps {
  children: ReactNode;
}

/**
 * Connects React Aria's links to the Next.js App Router, so `Link`, `Tab href`,
 * `Breadcrumb`, `MenuItem href` and the rest navigate on the client instead of
 * reloading the page. Render it once, near the root, inside `<body>`.
 *
 * Client Component. This folder is the only part of the library that imports
 * from `next/*` (DECISIONS D-018).
 *
 * VENDOR: `RouterProvider` takes `navigate` and an optional `useHref`
 * (react-aria 3.53.0 type definitions). INFERRED: passing `router.push` as
 * `navigate`; React Aria's docs no longer show a Next.js snippet. `useHref` is
 * left out because this app sets no `basePath`. RouterProvider.test.tsx
 * exercises the wiring.
 */
export function RouterProvider({ children }: RouterProviderProps) {
  const router = useRouter();
  return <AriaRouterProvider navigate={router.push}>{children}</AriaRouterProvider>;
}
