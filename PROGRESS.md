# PROGRESS

Single source of truth for what is built. Read this first in every session, then DECISIONS.md, COMPONENT-MAP.md and ARCHITECTURE.md.

**Last updated: 2026-10-08, after the first review round. Current phase: Phase 1 (foundations), second pass built, waiting for review. No component from the 64 has been started. One item is blocked: the Storybook application cannot start on this machine (see "Blocked" below). One choice is yours: which glass recipe becomes the default (see "Glass recipes" below and D-033).**

## How to fill this in

| Column | Allowed values | Rule |
| --- | --- | --- |
| Status | `not started` · `in progress` · `done` · `blocked` | `done` only when the definition of done in ARCHITECTURE.md section 10 is met |
| Tests passing | `—` (none yet) · `n/m` passing · `yes` | Copy the result of the actual Vitest run. Never write `yes` from memory |
| A11y checked | `—` · any of `axe-unit`, `keyboard`, `axe-browser`, `contrast-model`, `contrast-pixels`, `sr-manual` | List only the checks that ran and passed. `axe-browser` names the engines it ran in. `contrast-model` is the token computation in `contrast.test.ts`; `contrast-pixels` is the real-pixel reading in `glass-pixels.spec.ts`, with its engines (both added in Phase 1, because axe cannot judge text over `backdrop-filter`). `sr-manual` is a human screen-reader pass and cannot be filled by an agent |
| Known gaps | free text | Include deviations from Apple behavior and unsupported browsers |
| Date | ISO date of the last change to the row | |

## Phases

| Phase | Scope | Status | Date |
| --- | --- | --- | --- |
| 0 | Research and plan: SOURCES.md, COMPONENT-MAP.md, ARCHITECTURE.md, PROGRESS.md, DECISIONS.md | done, approved | 2026-10-08 |
| 1 | Foundations | built, awaiting review; playground application blocked | 2026-10-08 |
| 2 | Components, one HIG category per session | not started | — |
| 3 | Docs, audit against SOURCES.md, known gaps | not started | — |

## Phase 1: foundations

Unit tests: **210 of 210 passing in 13 files** (Vitest 5.0.3, jsdom; run of 2026-10-08). Browser tests: **56 passing, 2 skipped** across Chromium and Firefox (Playwright 1.64.0); the two skipped are refraction renderings that cannot be read in Firefox. WebKit could not be launched on this machine, so **nothing here is verified in Safari's engine**. No screen reader was run.

| Item | Status | Tests passing | A11y checked | Known gaps | Date |
| --- | --- | --- | --- | --- | --- |
| Workspace package `packages/ui` and exports map | done | `tsc`, ESLint (72 files, 0 findings) and `next build` pass | — | The eight category barrels are empty until Phase 2 | 2026-10-08 |
| Tokens: color | done | 12/12 `tokens.test.ts` (shared with typography and motion), 57/57 `contrast.test.ts` | `contrast-model`, `contrast-pixels` (Chromium, Firefox), `axe-browser` (Chromium, Firefox) | System colors are VERIFIED; labels, fills, separators and backgrounds are INFERRED. Accent ratios hold for the default accent only | 2026-10-08 |
| Tokens: spacing, radii, concentric helper | done | 3/3 (`concentric`, in `GlassSurface.test.tsx`) | — | All radii and control heights are INFERRED. Spacing is Tailwind's 4 px scale: the HIG publishes none. CSS passes a concentric radius down one level only; deeper levels call `concentric()` | 2026-10-08 |
| Tokens: typography | done | in `tokens.test.ts` | — | Apple's tracking table is not applied (it describes SF Pro). Emphasized weights are not tokens yet | 2026-10-08 |
| Tokens: motion | done | in `tokens.test.ts`; `expand.spec.ts` 5/5 (Chromium, Firefox) | — | Every duration and curve is INFERRED | 2026-10-08 |
| Standard materials (`Material`, utilities) | done | 10/10 | `axe-unit`, `axe-browser` (Chromium, Firefox), `contrast-model`, `contrast-pixels` (Chromium, Firefox) | Unverified in WebKit | 2026-10-08 |
| `GlassSurface` (tiers 0, 1, 2) | done | 39/39 (file shared with `GlassReveal`, `GlassGroup`, `concentric`, refraction detection) | `axe-unit`, `axe-browser` (Chromium, Firefox), `contrast-model`, `contrast-pixels` (Chromium, Firefox) | Does not adapt to what is behind it. `clear` has no contrast guarantee. Tier 2 runs in Chromium with a GPU only. Unverified in WebKit. **The look was reviewed once and found milky, with no visible edge curvature and a clear end that is not clear: the default is unchanged until a recipe is chosen (D-033)** | 2026-10-08 |
| Expanding surface (`GlassSurface expanded`, `GlassReveal`) | done | 6 unit tests (in `GlassSurface.test.tsx`), `expand.spec.ts` 5/5 (Chromium, Firefox), one of them frame by frame from video | `axe-unit`, `axe-browser` (Chromium, Firefox), `keyboard` (Enter and Space toggle, focus stays on the control, collapsed content is out of the tab order) | Replaces the `ViewTransition` morph, which lost the material mid-flight (D-032). Width animation needs content with a definite width. The collapsed radius makes a capsule up to 44 px tall. Do not combine with `interactive` on one element yet (both set the transition list) | 2026-10-08 |
| `GlassGroup` | done | 1 unit test | `axe-unit` | Layout only. Shapes never fuse. **No morph between two different surfaces** (the brief's shared identity): open, D-032 | 2026-10-08 |
| `LiquidGlassProvider`, `ThemeScript`, `LiquidGlassScope`, persistence | done | 23/23, 5/5, 6/6, 12/12, 3/3 (provider, scope and script, preferences, inline script, server render) | `axe-unit` | The glass budget default (12) is provisional. Forced colors has no manual switch (system only) | 2026-10-08 |
| Accessibility style layers (motion, contrast, forced colors, transparency) | done | `glass-pixels.spec.ts` 5/5 and `stories-axe.spec.ts` 13/13 per engine | `axe-browser` (Chromium, Firefox), `contrast-pixels` (Chromium, Firefox) | In forced colors axe runs without its contrast rule (it reads colors that are not on screen). `sr-manual` pending | 2026-10-08 |
| `Icon` abstraction and registry | done | 8/8 | `axe-unit`, `axe-browser` (Chromium, Firefox) | 15 names so far. The Lucide glyph is a Client Component in lucide-react 1.x. No app-wide runtime swap of the registry: use `createIcon()` | 2026-10-08 |
| Next.js adapter (`RouterProvider`) | done | 5/5 with `next/navigation` mocked; `next build` passes; the built app loads with no console message | `keyboard` (Enter on a link) | Not exercised against a real second route: the app has one page. No `useHref` (no `basePath`). Locale (`I18nProvider`) is not wired | 2026-10-08 |
| Test setup (Vitest, Testing Library, jest-axe, Playwright) | done | 210/210 unit, 56 browser | — | Vitest peer warning: wants `@types/node` 22 or 24+, the project has 20 | 2026-10-08 |
| Glass recipes comparison (story and its checks) | done, **awaiting your choice** | 21/21 `glass-recipes.test.ts`; one browser test that a recipe's own refraction filter is the one applied (Chromium) | `axe-browser` (Chromium, Firefox) | A tool for choosing, not a component. Six candidates; no default changed. D-033 | 2026-10-08 |
| Playground setup | **blocked** | Storybook config, 22 stories in 7 files and 4 test fixtures are written and type-check. `storybook dev` and `storybook build` cannot start | `axe-browser` through the stories harness | See "Blocked" below. The stories run through a stand-in (`pnpm stories`) | 2026-10-08 |

### Blocked: the Storybook application

`storybook` 10.6.1 loads a native module, `@oxc-resolver/binding-win32-x64-msvc` 11.21.2, and Windows refuses to load it: "Una directiva de Control de aplicaciones bloqueó este archivo". Smart App Control is in enforce mode on this machine and the file is unsigned. Nothing was done to get around that control.

What works instead, with no extra dependency: `tests/browser/harness` renders the same story files with Storybook's own portable-stories API (`composeStories`), with the same preview decorators and toolbar globals. `pnpm stories` serves it on port 6007 as a stand-in playground; `pnpm test:browser` builds it and runs the Playwright suite against it. It has no addon panels, no controls and no docs.

Options, yours to choose: (a) allow the WebAssembly build of the same resolver, `@oxc-resolver/binding-wasm32-wasi` (one more package, outside the approved list; untested, the package documents it as its fallback); (b) change the Smart App Control setting yourself; (c) keep the stand-in; (d) move the playground to Ladle (untested here). Recorded as D-024.

### Phase 1 measurements (2026-10-08, this machine: Windows 11, AMD Radeon RX Vega 11 graphics)

**Contrast on painted surfaces** (`glass-pixels.spec.ts`: 28 surfaces, four materials and regular glass at clarity 0, 0.5 and 1, light and dark, over pure black and pure white).

| Engine | How pixels were read | Largest difference from the model | Lowest ratio: label / secondary / tertiary |
| --- | --- | --- | --- |
| Chromium (Playwright revision 1248), tier 1 | screenshot | 1.3 of 255 | 7.25 / 5.37 / 3.62 |
| Chromium, tier 2 forced on | screenshot | 1.3 of 255 | 7.25 / 5.37 / 3.62 |
| Firefox 157.0 (Playwright build) | frame of a recorded video | 2.1 of 255 | 7.33 / 5.41 / 3.64 |
| WebKit 27.2 (Playwright build) | not run: the browser cannot start | — | — |

Floors asserted: 4.5:1 for primary and secondary labels, 3:1 for tertiary; under increased contrast 7:1 and 4.5:1 (passes in both engines). Clear glass is outside the guarantee: its label reaches 4.5:1 only on backdrops with relative luminance up to 0.07 (light) or 0.11 (dark), and up to 0.32 or 0.33 with the 35% dimming layer (computed in `contrast.test.ts`).

**Two traps found while measuring.**

1. Playwright's Firefox **screenshots** leave out every `backdrop-filter` effect, so a screenshot reports ratios as low as 1.31:1 that are not on screen. The video recording shows the real output and matches the model. `tests/browser/painted.ts` handles this.
2. In Firefox an SVG filter in `backdrop-filter` (`url(#…)`) is accepted by `CSS.supports()` and then **disables the whole backdrop filter** for that element: measured from video, the painted surface fell to 1.32:1 against its label. So tier 2 is gated on Chromium, and even `refraction="on"` cannot turn it on elsewhere.

**axe in a real browser** (`stories-axe.spec.ts`, axe-core 4.14.0, 22 stories, WCAG 2.2 A and AA plus best practices). 13 theme states per engine: light and dark by regular, clear and tinted glass; reduced transparency; increased contrast; right to left with iOS density; forced colors; system dark with reduced motion. Result in Chromium and in Firefox: **0 violations** in every state, 335 rule passes per state (315 in forced colors, where the contrast rule is off). Scope limits, printed by the run: 466 text nodes sit on glass or materials and are left to the pixel test; 3 nodes (5 in Firefox) where axe could not determine contrast; three page-level rules are off because a story is not a page.

**Refraction (tier 2).** Chromium: forcing the tier changes 32.4% of the pixels in the rim band and 0.0% in the middle of the surface, so the filter is applied and stays local to the edge. Detection: Chromium headless reports SwiftShader and stays at tier 1; Chromium with the GPU turns tier 2 on; Firefox reports `backdrop-filter: url()` as supported, has no `userAgentData`, and stays at tier 1.

**Glass budget** (frame time while scrolling content under N small capsule surfaces, 1280 by 800).

| Surfaces | Software rendering, tier 1 | Software rendering, tier 2 | Integrated GPU, tier 1 | Integrated GPU, tier 2 |
| --- | --- | --- | --- | --- |
| 6 | 16.7 ms | 19.7 ms | 16.7 ms | 16.8 ms |
| 12 | 16.8 ms | 44.6 ms | 16.7 ms | 17.1 ms |
| 24 | 19.1 ms | 260 ms | 16.8 ms | 18.8 ms |
| 48 | 40.6 ms | 480 ms | 17.5 ms | 39.3 ms |
| 96 | 93.8 ms | 503 ms | 37.3 ms | 97.4 ms |

Average frame time; 16.7 ms is 60 frames per second. Reading: 12 is the largest count that held 60 fps in every column but software tier 2, which is why the provider keeps tier 2 off under software rendering. **This is one desktop, small surfaces, one browser. The plan asked for a mid-range laptop and a phone: not done.** The default budget of 12 is provisional.

**Morphing, first round** (D-027, now superseded). React `ViewTransition` and React Aria `SharedElementTransition` both animate in Chromium and Firefox 157. With `ViewTransition`, a second click on the morphing surface waited 446 ms (the morph was 450 ms then): the surface takes no input until the morph ends. With `SharedElementTransition`, reversing mid-flight continued from the current size (173 by 53 to 151 by 44 within 30 ms).

**Morphing, second round: does `ViewTransition` drop the material?** Yes (D-032). Read from video frames in Chromium: a pill over 12 px black and white stripes, and one row of pixels in the pill's top padding. Glass that blurs and tints reads as one even tone on that row; bare stripes read as 0 to 255.

| Mechanism | Setting | At rest (darkest to lightest) | While changing size |
| --- | --- | --- | --- |
| `ViewTransition` as shipped in round one (page root left out of the transition) | tier 1, clarity 0.5, slowed to 1500 ms | 240 to 240 | 166 to 255, for the whole change, then back to even in one frame |
| The same | tier 2 on, clarity 1, 350 ms (the reviewer's settings) | 233 to 239 | 126 to 255 |
| `ViewTransition` with the page root included (browser default) | tier 1, clarity 0.5, 1500 ms | 237 to 241 | 230 to 248 |
| The real element growing (`GlassSurface expanded` with `GlassReveal`) | tier 1, clarity 0.5, 1500 ms | 236 to 240 | 236 to 242 |

Reading: a view transition animates a picture of the surface. With the page root left out, the picture's backdrop filter has nothing behind it, so the live page shows through sharp; with the root included the blur mostly holds, but the whole page is a frozen picture meanwhile. The real element keeps the material on every frame. `expand.spec.ts` now asserts that from video in Chromium and in Firefox (spread of at most 16 on every frame, tint within 12 of rest), and also that the element's own box and radius are in between mid-flight, that a second press lands while it moves and reverses from the size reached, that collapsed content is hidden and out of the tab order, and that reduced motion makes the change immediate.

**Glass recipes** (D-033). The story "Foundations/Glass recipes" puts six candidates side by side over stripes and over a drawn, photo-like scene, in light and dark, at the default clarity and at the clear end. The contrast row is computed from each recipe with the floors the shipped tokens are held to (4.5:1 primary and secondary, 3:1 tertiary; pure black and pure white backdrops; every interaction state; small surfaces). The figure given is the secondary label, the tightest one.

| Recipe | Default setting, light | Default setting, dark | Clear end, light | Clear end, dark |
| --- | --- | --- | --- | --- |
| 1. Current default | passes (6.1 over black, 8.2 over white) | passes (7.1, 5.6) | passes (4.7, 8.2) | passes (7.4, 4.9) |
| 2. Less veil, more saturation | passes (5.4, 8.2) | passes (7.9, 6.2) | passes (4.6, 8.2) | passes (7.9, 5.7) |
| 3. Near-transparent clear end | passes (5.9, 8.2) | passes (6.9, 5.0) | **fails over black** (1.0), passes over white (8.2) | passes over black (9.6), **fails over white** (1.0) |
| 4. Exaggerated refraction (a diagnostic) | **fails over black** (1.8), passes over white (8.2) | passes over black (8.0), **fails over white** (2.0) | **fails over black** (1.3), passes over white (8.2) | passes over black (8.1), **fails over white** (1.7) |
| 5. Asymmetric edge | as recipe 1, for the body of the surface | as recipe 1 | as recipe 1 | as recipe 1 |
| 6. Combined (2, 3 and 5) | passes (4.6, 8.2): thin margin | passes (7.7, 4.8) | **fails over black** (1.0), passes over white (8.2) | passes over black (9.8), **fails over white** (1.0) |

No default was changed: recipe 1 is checked against the shipped tokens by a test, and the painted pixels of the shipped glass are the same as before (1.3 and 2.1 of 255 from the model). Not modelled for recipes 5 and 6: the glow and shadow of the asymmetric edge, which reach about 10 px in from the top and bottom. The refraction rim (recipes 4, 5, 6) shows only in Chromium with a GPU.

**The app.** `next build` succeeds and `/` stays static. In the built app the inline script applied a stored theme with JavaScript blocked (dark, iOS density, clarity 0.9), and after hydration the console held no error or warning. Tailwind's automatic source detection does scan `packages/ui` (checked by building with the explicit `@source` removed).

### Phase 1 items not done

- Whether React Aria overlays close when Next.js hides their route with Activity (ARCHITECTURE 12.4). No overlay component exists yet; moved to the first batch that has one.
- Reading still pending from Phase 0: HIG focus-and-selection, keyboards, pointing-devices, modality; WWDC25 sessions 219 and 356; WWDC26 sessions 250 and 292. Read in Phase 1: HIG Color, Typography, Materials and Motion in full.
- Measuring the glass budget on a mid-range laptop and a phone.
- Any check in WebKit or Safari, and any screen-reader pass.
- A morph between two different surfaces that share an identity (the brief's "shared IDs"). `ViewTransition` is ruled out for glass; a FLIP on real elements is the candidate and is not built (D-032).
- Choosing a glass recipe and moving it into the tokens (D-033).

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
| 51 | Activity rings | B | not started | — | — | Decided (D-014, D-023): delivered as a generic `ProgressRings`, not a replica of Apple's Activity rings | 2026-10-08 |
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
| 2026-10-08 | Phase 1 | Decisions taken by the owner: D-001 yes, D-009 yes, D-010 Storybook, D-012 system font, D-013 `ref` as a prop, D-014 yes; D-003, D-019, D-020 deferred to their batches. Created `packages/ui` (`@caira/ui`), installed the dependencies of ARCHITECTURE section 11 with `react-aria-components` pinned to 1.22.0, built tokens, materials, `GlassSurface`, `GlassGroup`, `LiquidGlassProvider`, `ThemeScript`, `LiquidGlassScope`, `Icon`, the Next.js router adapter, the unit and browser test setups and the stories. Wired the app (`app/layout.tsx`, `app/globals.css`). Storybook's application is blocked by Smart App Control; a portable-stories harness stands in. New decisions D-023 to D-031 (they amend D-005, D-006, D-007 and D-011). Nothing committed |
| 2026-10-08 | Phase 1, review round 1 | The owner reviewed the playground and reported two problems: the morph lost its blur and veil mid-flight, and the glass read as milky frosted glass with no edge curvature and a clear end that was not clear. (1) Measured from video frames that `ViewTransition` is the cause; replaced it with the real element growing (`GlassSurface expanded`, new `GlassReveal`); removed `glassId`, `useGlassMorph` and the morph view-transition CSS; `GlassGroup` is now layout only and server-safe. D-032 supersedes D-027. (2) Added a comparison story with six recipes and their computed contrast verdicts; added inert knobs to `glass.css` and props to `GlassFilterDefs` so a recipe is only numbers; changed no default. D-033. Only `packages/ui`, PROGRESS.md and DECISIONS.md were edited in this round. Nothing committed |
