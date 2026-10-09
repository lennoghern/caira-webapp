# PROGRESS

Single source of truth for what is built. Read this first in every session, then DECISIONS.md, COMPONENT-MAP.md and ARCHITECTURE.md.

**Last updated: 2026-10-08. Current phase: Phase 0 complete, waiting for approval. No code written, no dependency installed.**

## How to fill this in

| Column | Allowed values | Rule |
| --- | --- | --- |
| Status | `not started` · `in progress` · `done` · `blocked` | `done` only when the definition of done in ARCHITECTURE.md section 10 is met |
| Tests passing | `—` (none yet) · `n/m` passing · `yes` | Copy the result of the actual Vitest run. Never write `yes` from memory |
| A11y checked | `—` · any of `axe-unit`, `keyboard`, `axe-browser`, `sr-manual` | List only the checks that ran and passed. `sr-manual` is a human screen-reader pass and cannot be filled by an agent |
| Known gaps | free text | Include deviations from Apple behavior and unsupported browsers |
| Date | ISO date of the last change to the row | |

## Phases

| Phase | Scope | Status | Date |
| --- | --- | --- | --- |
| 0 | Research and plan: SOURCES.md, COMPONENT-MAP.md, ARCHITECTURE.md, PROGRESS.md, DECISIONS.md | done, awaiting approval | 2026-10-08 |
| 1 | Foundations | not started | — |
| 2 | Components, one HIG category per session | not started | — |
| 3 | Docs, audit against SOURCES.md, known gaps | not started | — |

## Phase 1: foundations

| Item | Status | Tests passing | A11y checked | Known gaps | Date |
| --- | --- | --- | --- | --- | --- |
| Workspace package `packages/ui` and exports map | not started | — | — | Needs approval to edit `pnpm-workspace.yaml` (D-001) | 2026-10-08 |
| Tokens: color | not started | — | — | HIG values not transcribed yet | 2026-10-08 |
| Tokens: spacing, radii, concentric helper | not started | — | — | Radii are unpublished, will be INFERRED | 2026-10-08 |
| Tokens: typography | not started | — | — | HIG tables fetched, not transcribed | 2026-10-08 |
| Tokens: motion | not started | — | — | | 2026-10-08 |
| Standard materials (`Material`, utilities) | not started | — | — | | 2026-10-08 |
| `GlassSurface` (tiers 0, 1, 2) | not started | — | — | Tier 2 is Chromium only; detection method open | 2026-10-08 |
| `GlassGroup` (morphing) | not started | — | — | Mechanism open (D-007) | 2026-10-08 |
| `LiquidGlassProvider`, `ThemeScript`, persistence | not started | — | — | | 2026-10-08 |
| Accessibility style layers (motion, contrast, forced colors, transparency) | not started | — | — | | 2026-10-08 |
| `Icon` abstraction and registry | not started | — | — | | 2026-10-08 |
| Next.js adapter (`RouterProvider`) | not started | — | — | Wiring is INFERRED, needs a test | 2026-10-08 |
| Test setup (Vitest, Testing Library, jest-axe) | not started | — | — | Browser-level axe needs approval (D-009) | 2026-10-08 |
| Playground setup | not started | — | — | Storybook proposed (D-010) | 2026-10-08 |

## Phase 2: components (64)

Batch order from the brief: Layout, Menus and actions, Navigation and search, Presentation, Selection and input, Status, Content, System experiences.

### Batch 1: Layout and organization (10)

| # | Component | Tier | Status | Tests passing | A11y checked | Known gaps | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | Boxes | A | not started | — | — | | 2026-10-08 |
| 6 | Collections | A | not started | — | — | | 2026-10-08 |
| 7 | Column views | A | not started | — | — | ARIA model undecided (tree or listboxes) | 2026-10-08 |
| 8 | Disclosure controls | A | not started | — | — | | 2026-10-08 |
| 9 | Labels | A | not started | — | — | | 2026-10-08 |
| 10 | Lists and tables | A | not started | — | — | | 2026-10-08 |
| 11 | Lockups | A | not started | — | — | tvOS-only on Apple's side | 2026-10-08 |
| 12 | Outline views | A | not started | — | — | | 2026-10-08 |
| 13 | Split views | A | not started | — | — | No primitive; custom from APG | 2026-10-08 |
| 14 | Tab views | A | not started | — | — | | 2026-10-08 |

### Batch 2: Menus and actions (12)

| # | Component | Tier | Status | Tests passing | A11y checked | Known gaps | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15 | Activity views | B | not started | — | — | Web Share is not available everywhere | 2026-10-08 |
| 16 | Buttons | A | not started | — | — | | 2026-10-08 |
| 17 | Context menus | A | not started | — | — | | 2026-10-08 |
| 18 | Dock menus | B | not started | — | — | | 2026-10-08 |
| 19 | Edit menus | B | not started | — | — | Floating UI exception proposed | 2026-10-08 |
| 20 | Home Screen quick actions | C | not started | — | — | Analogue only | 2026-10-08 |
| 21 | Menus | A | not started | — | — | | 2026-10-08 |
| 22 | Ornaments | B | not started | — | — | Depends on Windows (39) for anchoring | 2026-10-08 |
| 23 | Pop-up buttons | A | not started | — | — | | 2026-10-08 |
| 24 | Pull-down buttons | A | not started | — | — | | 2026-10-08 |
| 25 | The menu bar | A | not started | — | — | Primitive undecided: Base UI exception or custom (D-003) | 2026-10-08 |
| 26 | Toolbars | A | not started | — | — | Overflow logic is custom | 2026-10-08 |

### Batch 3: Navigation and search (5)

| # | Component | Tier | Status | Tests passing | A11y checked | Known gaps | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 27 | Path controls | A | not started | — | — | | 2026-10-08 |
| 28 | Search fields | A | not started | — | — | WWDC26 session 292 not read yet | 2026-10-08 |
| 29 | Sidebars | A | not started | — | — | HIG text and WWDC26 disagree on floating versus edge-to-edge | 2026-10-08 |
| 30 | Tab bars | A | not started | — | — | | 2026-10-08 |
| 31 | Token fields | A | not started | — | — | Primitive is new in React Aria | 2026-10-08 |

### Batch 4: Presentation (8)

| # | Component | Tier | Status | Tests passing | A11y checked | Known gaps | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 32 | Action sheets | A | not started | — | — | | 2026-10-08 |
| 33 | Alerts | A | not started | — | — | | 2026-10-08 |
| 34 | Page controls | A | not started | — | — | No primitive; custom from APG | 2026-10-08 |
| 35 | Panels | A | not started | — | — | No APG pattern for non-modal windows | 2026-10-08 |
| 36 | Popovers | A | not started | — | — | | 2026-10-08 |
| 37 | Scroll views | A | not started | — | — | | 2026-10-08 |
| 38 | Sheets | A | not started | — | — | Primitive is new in React Aria | 2026-10-08 |
| 39 | Windows | A | not started | — | — | HIG advises against custom window UI; corner radius unpublished | 2026-10-08 |

### Batch 5: Selection and input (11)

| # | Component | Tier | Status | Tests passing | A11y checked | Known gaps | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 40 | Color wells | A | not started | — | — | Eyedropper is Chromium only | 2026-10-08 |
| 41 | Combo boxes | A | not started | — | — | | 2026-10-08 |
| 42 | Digit entry views | B | not started | — | — | | 2026-10-08 |
| 43 | Image wells | A | not started | — | — | | 2026-10-08 |
| 44 | Pickers | A | not started | — | — | Wheel style is custom | 2026-10-08 |
| 45 | Segmented controls | A | not started | — | — | Look of the macOS 27 "tabs" variant not described in text | 2026-10-08 |
| 46 | Sliders | A | not started | — | — | | 2026-10-08 |
| 47 | Steppers | A | not started | — | — | | 2026-10-08 |
| 48 | Text fields | A | not started | — | — | | 2026-10-08 |
| 49 | Toggles | A | not started | — | — | | 2026-10-08 |
| 50 | Virtual keyboards | B | not started | — | — | | 2026-10-08 |

### Batch 6: Status (4)

| # | Component | Tier | Status | Tests passing | A11y checked | Known gaps | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 51 | Activity rings | B | not started | — | — | **HIG says not to replicate Activity rings. Needs your decision** (D-014) | 2026-10-08 |
| 52 | Gauges | A | not started | — | — | | 2026-10-08 |
| 53 | Progress indicators | A | not started | — | — | | 2026-10-08 |
| 54 | Rating indicators | A | not started | — | — | | 2026-10-08 |

### Batch 7: Content (4)

| # | Component | Tier | Status | Tests passing | A11y checked | Known gaps | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Charts | A | not started | — | — | Chart engine undecided (D-020) | 2026-10-08 |
| 2 | Image views | A | not started | — | — | | 2026-10-08 |
| 3 | Text views | A | not started | — | — | | 2026-10-08 |
| 4 | Web views | A | not started | — | — | | 2026-10-08 |

### Batch 8: System experiences (10)

| # | Component | Tier | Status | Tests passing | A11y checked | Known gaps | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 55 | App Shortcuts | B | not started | — | — | Analogue: command palette | 2026-10-08 |
| 56 | Complications | C | not started | — | — | Analogue only | 2026-10-08 |
| 57 | Controls | B | not started | — | — | | 2026-10-08 |
| 58 | Live Activities | B | not started | — | — | | 2026-10-08 |
| 59 | Notifications | B | not started | — | — | Primitive undecided (D-019) | 2026-10-08 |
| 60 | Snippets | B | not started | — | — | | 2026-10-08 |
| 61 | Status bars | B | not started | — | — | | 2026-10-08 |
| 62 | Top Shelf | C | not started | — | — | Analogue only | 2026-10-08 |
| 63 | Watch faces | C | not started | — | — | Analogue only | 2026-10-08 |
| 64 | Widgets | B | not started | — | — | | 2026-10-08 |

## Totals

| | Count |
| --- | --- |
| Components | 64 |
| Tier A / B / C | 46 / 14 / 4 |
| not started | 64 |
| in progress | 0 |
| done | 0 |
| blocked | 0 |

## Session log

| Date | Session | What happened |
| --- | --- | --- |
| 2026-10-08 | Phase 0 | Inspected the repository, read the bundled Next.js docs, researched Apple, W3C, MDN and library sources, wrote the five planning files. No dependency installed, no existing file modified |
