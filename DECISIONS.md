# DECISIONS

Architectural decisions and their reasons, so a new session can continue without deciding again. Add a new entry for every decision; never rewrite an old one, supersede it.

Evidence labels and source IDs are defined in SOURCES.md. **Last updated: 2026-10-08 (Phase 0).**

## Status values

- **From the brief**: fixed by PROMPT.md. Not mine to change.
- **Proposed**: my recommendation. Stands unless you object.
- **Needs your decision**: touches existing files, adds cost, or conflicts with a source. Phase 1 or the named batch waits for it.

## Waiting on you

| ID | Question | Blocks |
| --- | --- | --- |
| D-001 | May Phase 1 edit `pnpm-workspace.yaml` and the other existing files listed in ARCHITECTURE.md section 11? | Phase 1 |
| D-009 | May Playwright be added for browser-level accessibility checks? | Honest "a11y checked" entries for contrast |
| D-010 | Storybook rather than Ladle? | Phase 1 playground |
| D-012 | Does the app keep Geist, or move to the system font stack? | `app/layout.tsx` edit |
| D-013 | `ref` as a plain prop instead of `forwardRef`? | Phase 1 component template |
| D-014 | Activity rings: accept a generic `ProgressRings` in place of a replica? | Status batch |
| D-003 | The menu bar: Base UI exception or custom build? | Menus batch (after a spike) |
| D-019 | Notifications: React Aria's unstable toast or Base UI's? | System experiences batch |
| D-020 | Chart engine | Content batch |

---

## D-001 The library is a workspace package, `packages/ui`, consumed from source

- **Status**: Needs your decision (it edits `pnpm-workspace.yaml` and `package.json`).
- **Decision**: Create `packages/ui` as a private pnpm workspace package named `@caira/ui`. One `exports` entry per HIG category plus `foundations`, `next` and `styles.css`. No root barrel. `sideEffects` lists CSS only. No build step: the app compiles the TypeScript source.
- **Why**: The brief asks for an isolated, tree-shakable package. A package owns its `sideEffects` and `exports`; a folder inside the app (`src/ui`) would have to set `sideEffects` for the whole app. Turbopack transpiles workspace packages automatically (L6). Test and playground dependencies stay out of the app's dependency list. `react-aria-components` uses the same CSS-only `sideEffects` shape (L1).
- **Alternative rejected**: `src/ui` inside the app. Simpler today, but no real isolation and no per-package `sideEffects`.
- **Consequence**: The package name `@caira/ui` is a placeholder taken from the repository name. Tell me if you want another.

## D-002 React Aria Components is the behavior layer; the client boundary is the component file

- **Status**: From the brief (library choice); Proposed (boundary rule).
- **Decision**: Every file that imports `react-aria-components` starts with `"use client"`. Category barrels carry no directive. Pure-markup pieces (`Icon`, `Material`, static `GlassSurface`, `ThemeScript`, style files) stay server-safe.
- **Why**: Each React Aria export file does `import "client-only"` (L1), so a server import fails the build. Putting the directive on barrels would make server-safe exports client-only.
- **Version**: 1.22.0 seen on 2026-10-08. Pin exactly in Phase 1; several primitives this plan relies on are recent (`Sheet`, `TokenField`, `NavigationTree`, `PreviewTrigger`).

## D-003 Exceptions to React Aria

- **Status**: From the brief (policy); Proposed (the list); Needs your decision for the menu bar after a spike.
- **Decision**:
  - The menu bar: `react-aria-components` 1.22.0 has no menubar. Candidate exception: Base UI `Menubar` with Base UI `Menu` beneath it. Alternative: a custom menubar built from the APG pattern over React Aria `MenuTrigger`s. A short spike in the Menus batch compares them; you choose.
  - Edit menus: Floating UI for anchoring to a text selection.
  - Context menus need **no** exception: `trigger="contextMenu"` exists in the types (L1).
  - Radix is not used.
- **Why the spike**: Base UI's menubar brings a second menu implementation that must look and behave exactly like the React Aria one. A custom menubar avoids that but owns tricky focus logic. This cannot be judged from documentation.

## D-004 Styling: Tailwind v4 tokens and utilities, `tailwind-variants`, the React Aria Tailwind plugin

- **Status**: From the brief (Tailwind, variants helper, tailwind-merge); Proposed (specific picks).
- **Decision**: Tokens in `@theme` and CSS variables. Glass and materials as `@utility` classes so no component carries long arbitrary-value strings. `tailwind-variants` (with `tailwind-merge`) for variants and slots. `tailwindcss-react-aria-components` for state variants.
- **Why `tailwind-variants` over `cva`**: slots fit compound components and it merges conflicts through tailwind-merge. The registry entry for `class-variance-authority` (0.7.1) was last updated in November 2024 (L7).
- **Constraint**: The app compiles CSS with the `@tailwindcss/turbopack` loader (LOCAL). Vitest and Storybook need `@tailwindcss/vite` at the same Tailwind version.

## D-005 Theme state lives on `<html>` as data attributes and CSS variables

- **Status**: Proposed.
- **Decision**: `LiquidGlassProvider` owns appearance, glass clarity, transparency, contrast, motion, platform density, accent and the macOS 27 layout options (ARCHITECTURE.md 5.2). It writes them to `<html>`, persists them in `localStorage` inside `try/catch`, and an inline `ThemeScript` applies them before first paint.
- **Why**: CSS reacts without React re-renders. The inline-script technique, `suppressHydrationWarning`, and the `useLayoutEffect` re-apply for Strict Mode come from the bundled Next.js guide (L6). The same guide warns against reading cookies in the root layout under Cache Components, which rules out server-side theme reads.
- **Why manual overrides exist**: `prefers-reduced-transparency` is not supported in Safari and is behind a flag in Firefox (W4). Without a manual switch, most Apple-device users could never get the reduced-transparency theme.

## D-006 Liquid Glass renders in three tiers

- **Status**: Proposed.
- **Decision**: Tier 0 solid, tier 1 frosted (`backdrop-filter` blur, saturation, brightness, plus CSS edge highlights), tier 2 refractive (SVG displacement through `backdrop-filter: url()`). Tier 1 is the design baseline. One shared filter definition. Nested glass renders tint only.
- **Why**: SVG filters in `backdrop-filter` are applied only by Chromium (W7, W8). Safari, where the comparison with the real material is most direct, gets tier 1. Apple advises limiting simultaneous effects and not layering glass on glass (A10, A12).
- **Not decided**: every number. Apple publishes none (SOURCES section 8). All glass metrics are INFERRED and tuned by eye in the playground with your review.

## D-007 Morphing uses React `<ViewTransition>` first

- **Status**: Proposed; one comparison left for Phase 1.
- **Decision**: `GlassGroup` uses React 19.3 `<ViewTransition>` with shared names. No browser support means an instant change, which is the required no-animation fallback.
- **Why**: It is in the installed React and documented in the bundled Next.js guide (L6, L8). It needs no extra dependency.
- **Open**: React Aria exports `SharedElementTransition` (L1). Phase 1 compares both on a real morph (compact to expanded pill) and keeps one. Constraint to remember: view transitions fire only from transitions, Suspense or deferred values, not from plain `setState`.

## D-008 Browser baseline: Chrome and Edge 111, Firefox 128, Safari 16.4

- **Status**: Proposed.
- **Decision**: The floor equals Tailwind CSS v4's floor (L4). Above it, features are progressive enhancements with the fallbacks in ARCHITECTURE.md section 7. Native `popover`, `<dialog>` and CSS anchor positioning are not relied on.
- **Why**: Tailwind v4 already fixes the floor, so a lower one is not achievable. React Aria manages overlays, focus and positioning itself, which removes the dependence on newer platform features.

## D-009 Tests: Vitest, Testing Library, jest-axe; browser-level axe for contrast

- **Status**: From the brief (first three); Needs your decision (browser-level checks).
- **Decision**: Unit, interaction and structural accessibility tests run in jsdom. Contrast is checked two ways: deterministic token tests (composite each material over white and over black, assert the ratio) and axe in a real browser over the theme matrix.
- **Why**: axe's color-contrast rule needs layout and computed colors, which jsdom lacks. The brief forbids claiming accessibility without a test behind it.
- **Cost**: Playwright and a browser download. If you decline, PROGRESS.md will record contrast as checked by token tests and by eye only.
- **Limit stated up front**: no agent can run a screen reader. `sr-manual` in PROGRESS.md is for a person.
- **Note**: Vitest 5 peers on `@types/node` 22 or 24+; the project pins 20.

## D-010 Playground: Storybook with `@storybook/react-vite`

- **Status**: Needs your decision (the brief allows Storybook or Ladle).
- **Decision**: Storybook 10.
- **Why**: Actively maintained (registry entry for 10.6.1 updated 2026-10-07; Ladle 5.1.1 last updated 2025-11-04, L7). It has an accessibility addon built on axe, toolbar globals for the theme matrix, and a Vitest integration that can serve D-009. The library is framework-agnostic outside `src/next/`, so the lighter `react-vite` framework is enough; the Next-specific one is not needed.
- **Trade-off**: heavier install and config than Ladle.

## D-011 Icons: Lucide behind `<Icon>` with an explicit registry

- **Status**: From the brief (open set, abstraction); Proposed (registry).
- **Decision**: Components ask for a semantic name (for example `chevron-forward`, `close`, `search`). A registry maps names to Lucide components, imported one by one. Apps can replace the registry.
- **Why**: SF Symbols and confusingly similar images are restricted (SOURCES section 7). Lucide is ISC-licensed. A registry keeps bundles small and lets the icon set be swapped without touching components. Direction-sensitive icons can be marked for RTL mirroring in one place.

## D-012 Fonts: system stack, nothing bundled

- **Status**: From the brief (no SF fonts); Needs your decision (Geist in the app).
- **Decision**: The library defines its own `system-ui`-first stack and never references SF by file.
- **Why**: The San Francisco license limits the fonts to mock-ups of interfaces for Apple operating systems and forbids embedding (A31). On Apple devices the system stack resolves to the system font with nothing shipped.
- **Your call**: `app/layout.tsx` loads Geist through `next/font/google`. The library does not depend on it. Keeping it means the app text is Geist and not the platform font.

## D-013 Refs: accept `ref` as a prop, no `forwardRef` wrapper

- **Status**: Needs your decision (the brief says "forwardRef where appropriate").
- **Decision**: Components take `ref` in their props type and pass it to the root element.
- **Why**: The project is React 19 only. React 19 lets function components receive `ref` as a prop (INFERRED: from the React 19 release documentation, not re-read this session; verify on react.dev before Phase 1). It removes a wrapper and simplifies generic components. `forwardRef` still works and is not marked deprecated in the installed `@types/react` 19.3.0 (LOCAL).
- **If you prefer `forwardRef`**: nothing else in the plan changes.

## D-014 All 64 components keep their tier; deviations are documented, one conflict needs you

- **Status**: Proposed; Needs your decision for Activity rings.
- **Decision**: No reclassification. Ten rows are flagged as deviations or conflicts in COMPONENT-MAP.md.
- **Conflict**: The HIG Activity rings page says "Don't replicate or modify Activity rings for other purposes" and "Never show Move, Exercise, and Stand progress in another ring-like element." A faithful SVG replica contradicts the source this library is built on. Proposal: deliver the row as `ProgressRings`, a generic concentric-progress component with its own colors and proportions, documented as not being Apple's Activity rings.
- **Second tension, no action needed**: HIG Windows says to avoid custom window UI and not to replicate the system appearance. An in-app window on the web is custom by necessity. The component draws its own controls and is documented as a web construct.

## D-015 Evidence labels in every document and in code comments

- **Status**: From the brief, extended.
- **Decision**: VERIFIED, STANDARD, REPORTED, INFERRED as the brief defines, plus VENDOR (a library's own docs or package files) and LOCAL (this repository). Token files tag each value group. Component JSDoc links the HIG page and names the Apple API.
- **Why**: Library facts and repository facts fit none of the brief's four labels, and calling them VERIFIED would blur "Apple said so".

## D-016 Apple content and assets policy

- **Status**: From the brief, made specific.
- **Decision**: No SF fonts, SF Symbols, Apple logos, app icons, wallpapers, UI kit exports or HIG artwork anywhere in the repository. HIG prose is linked and paraphrased, not copied. The library is described as "inspired by Apple's Human Interface Guidelines". Window controls and all glyphs are our own drawings.
- **Why**: Font license (A31), SF Symbols terms as stated in the HIG, Apple's site terms on reproduction (A33), trademark guidelines (A34). Summary in SOURCES section 7.
- **Not legal advice**: if the library is ever distributed outside this app, get a legal review, particularly on trade dress.

## D-017 macOS 27 behavior is the default; the macOS 26 look is an option

- **Status**: Proposed.
- **Decision**: Defaults follow macOS 27: uniform toolbar under scrolled content, edge-to-edge sidebars with accent-colored icons, one corner radius for all windows, stronger key-window cue, menu icons hidden unless requested, user-adjustable clarity. Each has a provider option for the earlier behavior (floating toolbar and sidebar, per-window radius, icons on every item).
- **Why**: The brief targets macOS 27, and all of these are confirmed by Apple (SOURCES section 3). The HIG Sidebars page still describes the floating style, so that style must remain available.

## D-018 Next.js 16 constraints the library designs around

- **Status**: Proposed.
- **Decision**:
  1. No `headers()` or `cookies()` in the root layout for locale or theme.
  2. Transient overlays close when their route is hidden by Activity.
  3. No global `:has()` selectors; global state goes through attributes on `<html>`.
  4. Only `src/next/` imports from `next/*`.
  5. Re-read the relevant bundled docs at the start of each phase, as `AGENTS.md` requires.
- **Why**: The project has `cacheComponents: true`. The bundled guides describe each of these effects (L6).

## D-019 Notifications primitive

- **Status**: Needs your decision.
- **Options**: (a) React Aria's toast, still exported with an `UNSTABLE_` prefix in 1.22.0, wrapped in one file so API changes stay contained. (b) Base UI `toast`, stable, as a documented exception.
- **Recommendation**: (a). The brief allows Base UI only where React Aria covers nothing, and React Aria does cover this. The wrapper limits the risk.

## D-020 Chart engine

- **Status**: Needs your decision, before the Content batch (seventh of eight, so not urgent).
- **Options**: (a) small hand-written SVG primitives for bar, line, area, point and sector marks; (b) Recharts 3; (c) visx 4.
- **Recommendation**: (a) for the mark types the HIG Charts page discusses, with a data-table alternative for accessibility, and no charting dependency. Revisit if the app needs advanced interaction (brushing, zoom, large data).
- **Why not decide now**: it depends on what charts the app needs, which only you know.

## D-021 Documentation is written in English

- **Status**: Proposed.
- **Decision**: The five planning files and all future docs are in English. Conversation and phase reports are in Spanish.
- **Why**: The brief asks for English code, identifiers, comments and file names, and the repository's own documents are in English. Say so if you want the docs in Spanish.

## D-022 The HIG JSON endpoint is a research aid, not a dependency

- **Status**: Proposed.
- **Decision**: The undocumented `tutorials/data/...json` endpoint was read once in Phase 0. It is not called by any script, test, build step or scheduled job in this repository. Later checks of a HIG page are done by reading that page when a batch needs it.
- **Why**: Apple's site terms prohibit automated access and reproduction of site content (A33), and the endpoint is undocumented and may change.
