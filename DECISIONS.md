# DECISIONS

Architectural decisions and their reasons, so a new session can continue without deciding again. Add a new entry for every decision; never rewrite an old one, supersede it.

Evidence labels and source IDs are defined in SOURCES.md. **Last updated: 2026-10-09 (Phase 1 closed; Phase 2 started with Boxes). Entries D-001 to D-022 are from Phase 0 and are left as written; D-023 onward record what was decided since and say which earlier entry they amend. D-027 is superseded by D-032 (confirmed in D-037). D-033 is resolved by D-034, and the question D-034 left open is resolved by D-038.**

## Status values

- **From the brief**: fixed by PROMPT.md. Not mine to change.
- **Proposed**: my recommendation. Stands unless you object.
- **Needs your decision**: touches existing files, adds cost, or conflicts with a source. Phase 1 or the named batch waits for it.

## Waiting on you

Answered on 2026-10-08 and recorded in D-023: D-001, D-009, D-010, D-012, D-013, D-014.

Answered on 2026-10-09: D-033 (which recipe is the default: recipe 2, recorded in D-034), and the margin that choice left at the clear end (accepted, D-035). The two-surface morph of D-032 was marked pending by you (D-037); it stays in the table because nothing is built.

Answered on 2026-10-09, closing Phase 1 (D-038): the asymmetric edge stays a trial and is not the default, which was the question D-034 left open.

| ID | Question | Blocks |
| --- | --- | --- |
| D-039 | Boxes was built as the template for the other components: native markup with no React Aria and no `"use client"`, a `title` prop instead of compound parts, no `<fieldset>` form, and a fixed set of files per component. Approve it, or change which part? | The other nine Layout components |
| D-024 | Storybook cannot start on this machine (Smart App Control blocks a native module). Allow the WebAssembly build, change the setting yourself, keep the stand-in, or switch to Ladle? | The playground application. Visual review can use `pnpm stories` meanwhile |
| D-032, D-037 | Morphing between two different surfaces that share an identity is not built, and is pending by your instruction of 2026-10-09. Build it as a FLIP on real elements, or leave it until a component needs it? | Batches that would morph one surface into another (Live Activities, Action sheets) |
| D-031 | Raise the root `@types/node` from 20 to 24 to match the Node 24 runtime and Vitest 5's peer range? | Nothing; it removes a warning |
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
- **Phase 1 use**: five HIG pages (color, typography, materials, motion, layout) were read again, once each, by hand-driven requests, to transcribe the published values. Nothing in the repository calls the endpoint.

---

# Phase 1 (2026-10-08)

## D-023 Owner decisions that closed Phase 0

- **Status**: Decided by the owner.
- **D-001**: yes. The library is the workspace package `@caira/ui` in `packages/ui`, and Phase 1 may edit the existing files listed in ARCHITECTURE section 11.
- **D-009**: yes. Playwright is installed for real-browser checks.
- **D-010**: Storybook. See D-024 for what happened when it was run.
- **D-012**: system font. Geist is removed from `app/layout.tsx`; the app uses the library's `--font-sans`.
- **D-013**: `ref` as a plain prop, no `forwardRef`. Verified two ways: react.dev's React 19 post says "Starting in React 19, you can now access `ref` as a prop for function components" and "In future versions we will deprecate and remove `forwardRef`" (R1); and the unit tests pass a `ref` prop to `GlassSurface`, `Material`, `Icon` and `LiquidGlassScope` and get the element back.
- **D-014**: yes. Activity rings are delivered as a generic `ProgressRings`.
- **Deferred to their batches, unchanged**: D-003, D-019, D-020.
- **Also instructed**: `react-aria-components` pinned to exactly 1.22.0; install only what ARCHITECTURE section 11 lists (see D-031 for the two places where that needed a judgment).

## D-024 Storybook cannot run here; a portable-stories harness stands in

- **Status**: Needs your decision.
- **Fact (LOCAL)**: `storybook dev` and `storybook build` (10.6.1) fail at start. Storybook requires `oxc-resolver` 11.21.2, whose native module `resolver.win32-x64-msvc.node` Windows refuses to load: "Una directiva de Control de aplicaciones bloqueó este archivo". Smart App Control is in enforce mode on this machine (`VerifiedAndReputablePolicyState` = 1) and the file is unsigned. Other unsigned native modules, including Vite's, load normally. Separately, Playwright's WebKit build does not start: it reports `libglesv2.dll`, `libxml2.dll` and `webcore.dll` as missing although the three files are on disk. INFERRED, not established: the same control refuses to load them.
- **Decision taken without you**: do not touch the control, and do not install anything outside the approved list. The Storybook configuration and the stories are written as planned. `tests/browser/harness` renders those same story files through Storybook's portable-stories API (`composeStories` from `@storybook/react-vite`, already installed), with the same preview decorators and toolbar globals. `pnpm stories` serves it; the Playwright suite runs against it.
- **Why a harness and not nothing**: the browser checks and the visual review both need the stories on a URL. This uses only installed packages and leaves the security control alone.
- **What the harness is not**: no addon panels (the accessibility addon is unused for now), no controls, no docs pages.
- **Your options**: (a) allow `@oxc-resolver/binding-wasm32-wasi`, the WebAssembly build the package itself falls back to (one extra package; untested here); (b) change the Smart App Control setting yourself (check first whether it can be turned back on: on some Windows builds it cannot without a reinstall); (c) keep the harness as the playground; (d) switch to Ladle, the other tool the brief allows (untested here, and it would need its own install).
- **Recommendation**: (a), because it keeps the chosen tool and the security setting.

## D-025 Contrast over glass: range compression, a tested floor, and real pixels

- **Status**: Proposed for the method; **needs your review** for the look.
- **Amends**: D-006, which left every number open.
- **Decision**: Materials and regular glass run the backdrop through `blur() saturate() contrast() brightness()` and then composite a tint. `contrast()` below 1 and `brightness()` squeeze any backdrop into a band (light appearance: black becomes mid gray, white stays white; dark appearance: the reverse). The label colors are then chosen so they pass on both ends of the band. `saturate()` runs first, so the later per-channel steps cannot leave the band.
- **Guarantee**: primary and secondary labels 4.5:1, tertiary 3:1, on all four materials and on regular glass at every clarity, size and interaction state; 7:1 and 4.5:1 under increased contrast. Quaternary carries no guarantee and never colors text. The accent tint keeps its label at 4.5:1 for the default accent only.
- **Not guaranteed**: the `clear` variant. It has no range compression, by design. Its measured limits are in PROGRESS.md and on the component.
- **How it was verified**: (1) `contrast.test.ts` computes every ratio from the tokens in the CSS files, over pure black and pure white; (2) `glass-pixels.spec.ts` reads the pixels Chromium and Firefox paint and checks them against that model (within 1.3 and 2.1 of 255) and against the floors; (3) axe in both browsers covers text on opaque backgrounds.
- **Why not rely on axe**: it composites the tint over the CSS color behind and ignores `backdrop-filter`, so on these surfaces it reports contrast for a color that is never painted.
- **Cost, stated plainly**: the floor costs translucency. Dark glass in particular is close to opaque, and the three clarity settings differ little in dark appearance. The values are INFERRED and were tuned to pass the tests, not by eye. Loosening them means lowering the guarantee; that trade is yours.
- **Dependency of the guarantee**: it holds where the browser paints `backdrop-filter`. Where it is unsupported, `@supports` switches to the solid tier. WebKit is unverified.

## D-026 Rendering tier 2 is gated on Chromium with a GPU

- **Status**: Proposed.
- **Amends**: D-006.
- **Decision**: Tier 2 applies only when the provider sets `data-glass-refraction="on"`, which it does when `CSS.supports("backdrop-filter", "url(...)")` is true, `navigator.userAgentData` names Chromium, and WebGL does not report a software renderer. `refraction="on"` skips the last test only. Nothing can turn it on outside Chromium.
- **Why**: measured in Firefox 157, the value parses and then the whole backdrop filter stops being painted for that element, blur and range compression included, which drops the label to 1.32:1. And under Chromium's software renderer 12 small refractive surfaces cost 45 ms per frame.
- **It is a heuristic**: page script cannot read backdrop-filter output, so there is no true feature test. If WebKit or Firefox start rendering it, they stay at tier 1 until this check is revisited.
- **The filter**: one shared SVG filter with no per-element map. A flood of the filter region is blurred into a height field; two Sobel passes make the displacement map; `feSpecularLighting` adds the edge light. Lengths are in CSS px, so the rim width does not depend on the element size. All numbers INFERRED.
- **Nested glass**: detected in CSS (`[data-glass] .glass-surface`), not through React context as ARCHITECTURE 6.3 said. That keeps `GlassSurface` server-safe.

## D-027 Morphing keeps React `ViewTransition`

- **Status**: Proposed; **needs your decision** on the trade-off below.
- **Resolves**: the comparison D-007 left open.
- **Decision**: `GlassSurface glassId` wraps the surface in `<ViewTransition>`; `useGlassMorph()` runs the update in a transition tagged `glass-morph`; CSS takes the page root out of transitions of that type.
- **Measured** (Chromium and Firefox 157, same pill built both ways): both mechanisms animate. With `ViewTransition` the morphing surface takes no click until the morph ends (a second click waited 446 ms of a 450 ms morph); the rest of the page stays live once the root is excluded. With React Aria's `SharedElementTransition` a reversal mid-flight continues from the current size.
- **Why keep `ViewTransition` anyway**: the same DOM element stays mounted, so keyboard focus survives the morph with no extra code (tested); `SharedElementTransition` swaps two elements and the caller must restore focus. `GlassSurface` stays server-safe. Content cross-fades for free. No new dependency surface.
- **What it costs**: the HIG asks to "let people cancel motion" and not make them wait for an animation. During its own morph a surface cannot be pressed. The morph is 350 ms to keep that short.
- **If you prefer interruptible morphs**: `SharedElementTransition` is already installed; the cost is a client-only wrapper, explicit sizes on both states, and focus restoration in every caller.
- **Deviation kept on record**: Apple's container fuses neighboring shapes; `GlassGroup spacing` is only a gap.

## D-028 Theme state: an external store, scopes, and `--accent-custom`

- **Status**: Proposed.
- **Amends**: D-005 and ARCHITECTURE 5.3.
- **Decision**:
  1. Preferences live in a small store read through `useSyncExternalStore`, not in a lazy `useState` initializer. The server snapshot is the defaults.
  2. `LiquidGlassScope` themes a subtree with the same attributes the provider writes on `<html>`. It requires an explicit `appearance`.
  3. The accent knob is `--accent-custom`; components read `--accent`.
  4. The macOS 27 layout options are provider props mirrored as attributes, and are not persisted.
  5. `--glass-clarity` is declared on `:root` only.
- **Why 1**: with a lazy initializer the first client render differs from the server HTML whenever storage holds something, and anything rendered from the preferences mismatches. The store hydrates with the defaults and then updates. Tested with `hydrateRoot`: no recoverable error, no console error. It also follows other tabs through the `storage` event.
- **Why 2 and 5**: token blocks are declared on `:root, [data-appearance]`, so a scope re-declares every color. A value declared there would reset inside each scope; clarity and the custom accent must inherit instead.
- **Why 3**: `--accent` defaults to system blue, which differs per appearance, so it has to be re-declared per scope; a separate input variable lets the person's choice pass through.
- **The inline script** is a hand-written string, checked against the provider's own function for nine stored states and for a hostile key and default.

## D-029 Icons: a typed registry, `createIcon()`, and what "server-safe" means here

- **Status**: Proposed.
- **Amends**: D-011.
- **Decision**: `Icon` reads a module-level registry (15 semantic names so far). `createIcon(registry)` returns an `Icon` bound to another registry. There is no runtime, app-wide swap of the registry used inside library components.
- **Why no runtime swap**: a Server Component cannot read context, and a module-level setter would have to run identically on the server and in the browser or hydration breaks. To change the set used by the library itself, edit `registry.ts`: the package is consumed from source.
- **Fact (VENDOR)**: in lucide-react 1.53.0 the base `Icon` module starts with `"use client"` and reads a context. So `Icon` can be rendered from a Server Component, but the glyph's code is sent to the browser.

## D-030 Typography, class merging and the accent derivations

- **Status**: Proposed.
- **Decision**:
  1. Text styles are Tailwind theme sizes (`text-body`, `text-title1`, ...) in rem, with the HIG line height and weight attached. 1 pt is taken as 1 CSS px.
  2. Apple's tracking table is not applied.
  3. `cn()` and `tv()` use a tailwind-merge configuration that knows the library's tokens; a test fails if the stylesheets and that configuration drift apart.
  4. Filled accent controls use `--accent-fill` (accent mixed 75% with black) and accent-colored text uses `--accent-text`.
- **Why 1**: rem follows the browser's text-size setting, the nearest web analogue to Dynamic Type. The values are VERIFIED; the unit mapping is INFERRED.
- **Why 2**: the table describes SF Pro for mock-ups, and the HIG says the running system tracks the font itself. On other platforms `system-ui` is a different typeface.
- **Why 3**: without it `text-body` (a size) and `text-label` (a color) are read as the same group and one is dropped.
- **Why 4**: system blue under white text is 3.5:1 (computed from the VERIFIED values). The derived fill gives 4.5:1 or better for the default accent in all four color states.

## D-031 Tooling choices made while installing

- **Status**: Proposed; one question for you.
- **Installed**: exactly the packages ARCHITECTURE section 11 lists (versions in ARCHITECTURE section 2). `react`, `react-dom`, `next`, `tailwindcss`, `typescript` and the React types were also declared in `packages/ui` at the versions already in the repository; that downloads nothing and gives the package its own resolvable copies.
- **Judgment 1**: `vite` 8.3.4 was installed by pnpm as a required peer of Vitest, `@vitejs/plugin-react`, `@tailwindcss/vite` and Storybook. It is not declared in any `package.json`.
- **Judgment 2**: `vite-tsconfig-paths` was installed as listed and then removed. Vite 8 prints that it resolves tsconfig paths natively, and the package has no path aliases.
- **axe-core** is not a direct dependency. Unit tests use the copy inside `jest-axe` (4.12.1); the browser tests load the copy inside `@storybook/addon-a11y` (4.14.0).
- **jest-axe** ships no types; `src/test/jest-axe.d.ts` declares the parts used.
- **esbuild's install script** is not run (pnpm asks for approval). Nothing failed without it.
- **Playwright browsers**: Chromium, Firefox and WebKit were downloaded (1.3 GB in `%LOCALAPPDATA%\ms-playwright`, outside the repository). You approved "a browser download"; three were fetched so the engines could be compared. WebKit cannot start here (D-024) and can be deleted.
- **Question**: Vitest 5 wants `@types/node` 22 or 24+; the root has 20 while Node is 24. Raising it is one line in the root `package.json`. Left alone because it is not on the approved list.

---

# Phase 1, review round 1 (2026-10-08)

The owner reviewed the playground and reported that the morph lost its blur and veil while it ran, and that the glass read as milky frosted glass. Instructions for this round: measure the morph from video frames and, if `ViewTransition` is the cause, replace the expand and collapse morph with an animation of the real element; build a comparison of recipes before changing any default; do not lower the contrast thresholds; keep AA at the default setting and under increased contrast (the clear end may have no guarantee, documented); edit nothing outside `packages/ui` except this file and PROGRESS.md.

## D-032 A glass surface grows as the real element. `ViewTransition` is no longer used

- **Status**: Decided (the owner's instruction, conditional on a measurement that came out positive). One follow-up **needs your decision**.
- **Supersedes**: D-027, and the proposal in D-007.
- **Measured** (video frames, Chromium, a pill over 12 px black and white stripes; the figures are the darkest and lightest pixel on a row inside the pill, where blurred and tinted glass is one even tone and bare stripes are 0 to 255):

  | Mechanism | Setting | At rest | While changing size |
  | --- | --- | --- | --- |
  | `ViewTransition`, as D-027 shipped it (page root left out) | tier 1, clarity 0.5, slowed to 1500 ms | 240 to 240 | 166 to 255 for the whole change, then even again in one frame |
  | The same | tier 2 on, clarity 1, 350 ms | 233 to 239 | 126 to 255 |
  | `ViewTransition` with the page root included | tier 1, clarity 0.5, 1500 ms | 237 to 241 | 230 to 248 |
  | The real element growing | tier 1, clarity 0.5, 1500 ms | 236 to 240 | 236 to 242 |

- **Cause**: a view transition animates snapshots of the surface, not the surface. The transition group does carry the backdrop filter, but D-027 took the page root out of the transition to keep the page live, and then the group has nothing behind it to filter: the live page shows through sharp. With the root included the blur mostly holds, but the whole page is a frozen picture for the duration. In both forms the surface takes no click while it runs. So the fault is in the mechanism, and the D-027 mitigation made it visible.
- **Decision**: `GlassSurface` takes `expanded`; the part that appears goes in the new `GlassReveal`. The reveal is a grid whose track animates between `0fr` and `1fr` (height, and width with `axis="both"`), so the surface has a real size on every frame with no measuring in script. The surface animates its corner radius between a capsule radius and the radius of its size, and its padding. No snapshot, no script, no new dependency; all of it is server-safe.
- **Removed**: the `glassId` prop, `useGlassMorph`, the `glass-morph` view-transition rules and `::view-transition { pointer-events: none }`. `GlassGroup` is now layout only and no longer a Client Component. `motion.css` keeps the reduced-motion rule for view transitions, for apps that use them between routes.
- **What else it changes**: a press while it moves lands at once and the change reverses from the size reached; focus stays on the control because nothing is remounted; collapsed content is `visibility: hidden`, so it is out of the tab order and not read; with reduced motion the size changes at once; it needs no View Transitions API (Firefox before 144, Safari before 18).
- **Verified**: `expand.spec.ts`, 5 of 5 in Chromium and in Firefox. The first test reads every frame of a recording and requires the row inside the surface to stay one even tone (spread of at most 16) and within 12 of its tone at rest; the old mechanism measured a spread of 78 or more. 6 unit tests cover the markup and the keyboard.
- **Stale elsewhere**: ARCHITECTURE.md sections 6.4 and 13.3 to 13.5 still describe the `ViewTransition` morph, `glassId`, `useGlassMorph` and `GlassGroup` as a Client Component. They were not edited in this round, under the instruction to change nothing outside `packages/ui` but this file and PROGRESS.md. Where they disagree with this entry, this entry is right.
- **Limits**: animating the width needs content with a definite width. The default collapsed radius (22 px) makes a capsule only up to 44 px tall; `--glass-radius-collapsed` adjusts it. `glass-expandable` and `glass-interactive` both set the transition list, so they should not sit on one element yet. Unverified in WebKit.
- **Open, needs your decision**: the brief asks for morphing between elements with shared IDs "using View Transitions API or FLIP". The first is ruled out for glass by the table above. A FLIP on real elements remains (React Aria's `SharedElementTransition`, already installed, is one). In the control run it kept the material, but one 40 ms sample at the swap showed bare stripes (0 to 255); that was not investigated. It is not built, because this round covered expanding and collapsing only. Until it is, two different surfaces do not morph into each other, and `GlassSurface` and `GlassGroup` say so.

## D-033 Glass recipes: a comparison first, no default changed

- **Status**: Needs your decision (choose by eye).
- **Follows from**: D-025, whose look you reviewed and found milky, with no visible curvature at the edge and a clear end that stayed milky.
- **What exists**: the story "Foundations/Glass recipes", one page: six recipes as columns; rows for stripes and a photo-like scene at the default clarity, then both again at the clear end; once in light and once in dark. Under each column, the contrast verdict computed from that recipe.
- **The recipes**:
  1. Current default. The shipped tokens (a test compares them).
  2. Less veil, more saturation. The lift that keeps text legible moves from the white or dark veil into the brightness and contrast steps, with saturation raised before them, and the blur is lighter.
  3. Near-transparent clear end. The filter steps fade out along the slider, on a quadratic curve so the default setting stays compressed, and the clear end is almost bare glass.
  4. Exaggerated refraction. A diagnostic, not a candidate: almost no veil or blur and a wide, strong rim, to show whether the filter is applied at all.
  5. Asymmetric edge. The current fill with a bright reflection along the top, a soft shadow along the bottom, and the refraction light moved to straight above.
  6. Combined. Recipes 2, 3 and 5 with a moderate rim.
- **Contrast, thresholds unchanged** (4.5:1 primary and secondary, 3:1 tertiary; pure black and pure white backdrops; every interaction state; small surfaces, the worst case): recipes 1, 2 and 5 keep the floors at the default setting and at the clear end. Recipes 3 and 6 keep them at the default setting (recipe 6 with a thin margin in light: 4.6:1 over black) and lose them at the clear end, where in light appearance text fails over a black backdrop and passes over white, and in dark appearance the reverse (about 1:1 in the failing case: text and backdrop are the same tone). Recipe 4 fails that same way at every setting. The table with every ratio is in PROGRESS.md and under each column of the story. `glass-recipes.test.ts` pins every one of these verdicts.
- **Why no recipe is both bare and legible at the default setting**: labels have one color per appearance. For dark text to reach 4.5:1 over any backdrop, a black backdrop has to be lifted to about middle gray, and for light text a white one pushed down. Apple's glass avoids that by turning light or dark with what is behind it; the web cannot sample the backdrop. What a recipe can choose is how to lift: with a veil, which whitens (the milky look), or with the filter, which keeps color (recipe 2).
- **How the recipes are built**: as numbers for knobs `glass.css` reads, so the story shows what adopting one would ship. Knobs added, none set by default: `--glass-clarity-ease`, `--glass-saturate-clear`, `--glass-contrast-clear`, `--glass-brightness-clear`, `--glass-edge`, `--glass-sheen-image`, `--glass-refraction-filter`; and `GlassFilterDefs` takes `id`, `displacement`, `rim`, `highlight` and `lightAzimuth`. Evidence that the default did not move: the shipped glass still paints within 1.3 (Chromium) and 2.1 (Firefox) of 255 of the model, the same as before.
- **Increased contrast** is outside the comparison: it keeps its own, more opaque tokens whichever recipe is chosen, and with it switched on the story shows that glass in every cell.
- **What adopting a recipe involves**: moving its numbers into the token blocks; teaching `contrast.test.ts` the clarity-dependent filter steps and, for recipes 5 and 6, the edge band, which is not modelled yet; and, for recipes 3 and 6 only, changing what that test asserts at the clear end from "keeps the floor" to a documented limit, as the `clear` variant has today. That narrows the scope of the guarantee, which you allowed for the clear end; it does not lower a threshold.
- **Not verified**: how any of this looks to a person, which is the point of the story; anything in WebKit; the rim outside Chromium with a GPU. The "photo" is a scene drawn in SVG, not a photograph.

---

# Phase 1, review rounds 2 and 3 (2026-10-09)

The owner looked at the comparison of D-033 and chose a recipe by eye, asked for the contrast to be read again on real pixels with 5:1 for the secondary label, and then accepted the one margin that came out thin. Rules that held throughout: no test threshold is lowered; AA holds at the default setting and under increased contrast; looks are chosen by the owner by eye. The entries above are left as written; where one of these four disagrees with an earlier entry, the later one is right.

## D-034 Recipe 2, "less veil, more saturation", is the default regular glass

- **Status**: Decided by the owner on 2026-10-09, by eye, from the story "Foundations/Glass recipes". One follow-up **needs your decision** (the edge, below).
- **Resolves**: D-033, which is closed: the comparison it describes was made and a recipe was chosen. **Amends**: D-025. Its method and its guarantee stand; its numbers, its "within 1.3 and 2.1 of 255" and its remark that dark glass is close to opaque describe the default it had then.
- **Decision**:
  1. Recipe 2 is the default for regular glass, in light and in dark.
  2. Recipe 6 (the combination of 2, 3 and 5) is discarded as illegible. It is removed from the story and from `glass-recipes.ts`.
  3. The asymmetric edge of recipe 5 is not adopted. It is tried on top of recipe 2 in a story of its own, "Foundations/Glass recipes: Asymmetric edge on the default".
  4. Recipes 1, 3 and 4 stay in the comparison story as a record: 1 as the previous default, 3 and 4 as not adopted.
- **The values that ship** (`glass.css`; all INFERRED, chosen by eye and held by the tests):

  | Token | Light | Dark |
  | --- | --- | --- |
  | `--glass-tint-color` | `rgb(255 255 255)` | `rgb(22 22 24)` |
  | `--glass-saturate` | 2.6 | 2.4 |
  | `--glass-contrast` | 0.35 | 0.4 |
  | `--glass-brightness` | 1.85 | 0.3 |
  | `--glass-alpha-tinted` / `-clear` / `-min` / `-max` | 0.5 / 0.06 / 0.06 / 0.96 | the same |
  | `--glass-blur-tinted` / `-clear` | 26px / 6px (16px at the default setting) | the same |
  | `--glass-sheen` | white at 12% | white at 4% |

- **Left as it was**: increased contrast keeps the more opaque recipe it had, blur included (40px and 10px), because there legibility outranks the look. The four materials, the `clear` variant, colored glass and the knobs D-033 added are unchanged, and no knob is set by default.
- **Verified, thresholds unchanged**: `contrast.test.ts` passes on the new tokens exactly as it stood (57 of 57). `glass-recipes.test.ts` (24 of 24) checks that recipe 2 equals the shipped tokens. `glass-pixels.spec.ts` reads 52 painted surfaces in Chromium and in Firefox: every floor holds; the painted color is within 1.4 (Chromium) and 4.1 (Firefox) of 255 of the model (see D-036). The margins are in D-035.
- **What it costs**: the lift that keeps text legible now comes mostly from the filter steps, so less whitening, and less margin where the veil used to help: the clear end over a black backdrop in light appearance (D-035).
- **Open, needs your decision**: whether the asymmetric edge becomes part of the default. Its glow and shadow reach about 10 px in from the top and bottom, and that band is not in the contrast model, so adopting it means modelling it first.
- **Not verified**: anything in WebKit; the refraction rim outside Chromium with a GPU.

## D-035 The secondary label has 5:1 at rest, and the margin at the clear end is accepted

- **Status**: Decided by the owner on 2026-10-09, in two steps: the 5:1 requirement in round 2, the acceptance in round 3.
- **Decision**:
  1. On top of the floors, the secondary label has at least 5:1 on every surface at rest. It is asserted in the model along the whole clarity slider (`glass-recipes.test.ts`) and on painted pixels in both engines (`SECONDARY_AT_REST` in `glass-pixels.spec.ts`).
  2. The floors stay where they were: 4.5:1 for primary and secondary labels and 3:1 for tertiary, in every interaction state; 7:1 and 4.5:1 under increased contrast.
  3. 5:1 is not required of a hovered or pressed surface. On light glass at the clear end over black the secondary label is 4.86 hovered and 4.53 pressed (Chromium; 4.85 and 4.51 in Firefox). **The owner accepts that margin and the recipe does not change.**
- **The narrowest margin in the library** (LOCAL, painted pixels, 2026-10-09): the secondary label on light regular glass at the clear end (clarity 1), pressed, over pure black. It is 0.01 to 0.03 above 4.5:1 where the tests run. Only that combination: at the default clarity the pressed case is 5.44 in the model, and in dark appearance the secondary label on glass is never under 6.03.
- **Checked against everything else**: the 2,364 ratios `contrast.test.ts` holds to a floor were listed by margin. That surface is first in the model too (4.58). The next are accent-colored text on the dark tertiary background (4.65 on a floor of 4.5) and the focus ring on the light secondary background (3.16 on a floor of 3).
- **How stable the reading is** (the pressed surface, gray level of 255; the secondary label reaches 4.5:1 at 141.65):

  | Setup | Painted | Ratio | Levels above the floor |
  | --- | --- | --- | --- |
  | Firefox 157 headless (the suite) | 142.00 | 4.51 | 0.35 |
  | Chromium 156 headless, software rendering (the suite) | 142.47 | 4.53 | 0.82 |
  | Chromium 156, Chrome 154, Edge 155 and Firefox 157 with a window (GPU) | 143.00 | 4.56 | 1.35 |

  Repeat runs of one setup gave the same figure every time, so the test does not flicker. It does depend on the engine and on what draws the page, by up to one 8-bit level, and the two setups the suite uses are the tightest. A setup that painted 141 would give 4.47:1 and fail. Not measured: WebKit, another GPU or driver, another operating system, a later browser version. The full table is in PROGRESS.md, "Review round 3".
- **If that test fails on another setup**: it is a real shortfall of a few hundredths there, not noise. The floor is not lowered and the model tolerance of D-036 does not apply (the ratio is computed from the painted color). The fix is one of the options below, and that choice is the owner's.
- **Options offered and not taken** (each alone brings the pressed case to 5:1 or more in the model): raise the light `--glass-alpha-clear` from 0.06 to 0.20 (5.12; the clear end gets a 20% veil); raise the light `--glass-brightness` from 1.85 to 2.05 (5.17; lifts dark backdrops more at every setting); cut the light hover and pressed overlays to 2% and 3.5% (5.02; the press feedback becomes hard to see).
- **Where it is written down**: the token comment in `glass.css`, the comment on `TIGHTEST_SURFACE` in `glass-pixels.spec.ts`, which also prints the headroom in levels on every run, and PROGRESS.md.
- **Still true from D-025**: the `clear` variant is outside the guarantee altogether. This entry is about regular glass with the clarity setting at its clear end, which is inside it.

## D-036 The model check allows Firefox 6 levels of 255 instead of 4

- **Status**: Taken while working in round 2 and reported then; recorded here at the owner's request. Stands unless you object.
- **What changed**: `glass-pixels.spec.ts` compares each painted surface with the color the model predicts. The allowed distance was 4 levels of 255 for every engine. It is still 4 for Chromium and is now 6 for Firefox (`TOLERANCE_BY_ENGINE`).
- **Why**: with recipe 2, Firefox paints dark glass at the clear end over a white backdrop 3 to 4 levels lighter than the model and than Chromium: 55, 68 and 73 at rest, hovered and pressed, where both have 52, 64 and 70. Its largest distance from the model is 4.1 of 255 (Chromium: 1.4). With the previous default the largest distances were 1.3 and 2.1 (D-025); that recipe had a heavier veil and a wider blur at the clear end, which left less of the filter's output showing.
- **Why it is the engine and not the measurement**: Firefox is read from a recorded video, because its screenshots leave out `backdrop-filter`. A Chromium recording read the same way matches Chromium's own screenshots, so the video is not what shifts the figure. What inside Firefox produces the difference is not established.
- **What it is not**: a contrast threshold. Every ratio is computed from the painted color itself, never from the model, so this number cannot hide a failure of a floor. On that surface Firefox's lighter paint costs contrast under the light text and is counted: 7.64 at rest against Chromium's 8.03, with a floor of 4.5.
- **Why 6**: it leaves about two levels over what was measured. 4 would fail the run on an engine difference that reaches no floor; a wider one would stop catching a real divergence between the model and the tokens.
- **Limit**: the tolerance is per engine, not per surface, so every Firefox surface gets 6 although only one needs it. Of the 52 Firefox surfaces, the hovered one of those three is the only one over 4 levels (4.1), the other two are about 3 away, and the remaining 49 are within 2. In Chromium all 52 are within 1.4.

## D-037 Morphing: the real element is confirmed, and D-027 stays superseded

- **Status**: Decided for what is built (the owner's instruction of round 1, kept after the review of 2026-10-09). The morph between two different surfaces is **pending** by the owner's instruction.
- **Confirms**: D-032, which already made this change on 2026-10-08. **Supersedes**: D-027, and the proposal in D-007. Nothing in D-027 is in the code: `glassId`, `useGlassMorph` and the `glass-morph` view-transition rules are gone.
- **The decision, restated**: a glass surface that expands or collapses is the real element changing size (`GlassSurface expanded`, with `GlassReveal` around the part that appears), not a view transition. The reason is the measurement in D-032: a view transition animates a picture of the surface, and the picture lost its blur and veil for the whole change.
- **What changed since D-032 was written**:
  1. ARCHITECTURE.md was brought up to date on 2026-10-09: section 6.4 is rewritten, and the lines that depended on it in sections 4, 6.2, 7 and 13.2 to 13.5. The "Stale elsewhere" note in D-032 no longer applies.
  2. The question D-032 left open has an answer for now: **morph between different surfaces: pending**. It is not built and not scheduled. A view transition stays ruled out for glass; a FLIP on real elements is the candidate (React Aria's `SharedElementTransition` is installed). The one sample of bare backdrop seen at the swap in the control run has still not been investigated.
  3. Browser support for the mechanism (STANDARD, MDN browser-compat-data): animating grid tracks needs Chrome 107, Firefox 66 or Safari 16, all inside the baseline of D-008. No View Transitions API is needed.
- **Verified again on 2026-10-09**, with recipe 2 as the default: `expand.spec.ts`, 5 of 5 in Chromium and in Firefox. The file's time limit is now 90 seconds, because one Firefox test took 40 seconds in a full run with other workers recording video and 16 seconds alone; the assertions are the same.
- **Not verified**: WebKit.

---

# Phase 1 closed, Phase 2 started (2026-10-09)

The owner closed Phase 1 and asked for the Layout category, one component first (Boxes) as the template for the rest, then a stop for review.

## D-038 Phase 1 is closed: recipe 2 is the default, the asymmetric edge stays a trial, the look is tuned later through tokens

- **Status**: Decided by the owner on 2026-10-09.
- **Confirms**: D-034 item 1. **Resolves**: the question D-034 left open, whether the asymmetric edge goes onto the default glass.
- **Decision**:
  1. Recipe 2, "less veil, more saturation", chosen by the owner by eye, is the default for regular glass. No value changes with this entry: it is what `glass.css` has shipped since review round 2 (the table in D-034).
  2. The asymmetric edge of recipe 5 stays a trial and is not the default. Its story, "Foundations/Glass recipes: Asymmetric edge on the default", is kept, and the knobs it uses (`--glass-edge`, `--glass-sheen-image`, `--glass-refraction-filter`) stay unset by default.
  3. Fine-tuning of the look waits until real components exist, and will be done by changing tokens only.
- **What item 3 asks of Phase 2** (INFERRED: my reading of the instruction, not the owner's words): a component takes its look from the tokens and from the glass and material utilities and carries no glass numbers of its own, so that a later change to the tokens re-tunes every component at once. No recipe value changes during Phase 2 without the owner choosing it by eye, and the rules of rounds 2 and 3 still hold: no contrast threshold is lowered.
- **If the edge is ever adopted**: its glow and shadow reach about 10 px in from the top and bottom, and that band is not in the contrast model, so it has to be modelled first (D-034).
- **Documents**: ARCHITECTURE.md 13.5 item 7 is corrected. Left as it was, outside the instruction: the last line of ARCHITECTURE.md 13.6, "The visual design has not been reviewed by a person", which is no longer true of the glass recipe.

## D-039 Boxes: native markup with no React Aria, and the shape of a component folder

- **Status**: Proposed. Built this way on 2026-10-09; the owner reviews it as the template before the other nine Layout components.
- **Amends**: COMPONENT-MAP.md row 5, whose primitive was React Aria's `Group`, and with it the totals there (42 rows backed by React Aria instead of 43, 21 custom instead of 20). ARCHITECTURE.md sections 2 and 4 still state the Phase 0 figures.
- **Decision**:
  1. `Box` is a `<div role="group">` named by its title through `aria-labelledby`. It imports nothing from `react-aria-components` and has no `"use client"`. The title id comes from `useId`.
  2. It is one export with a `title` prop, not compound parts. The parts inside are reached with `classNames`.
  3. There is no `<fieldset>` form.
  4. Its look is tokens only: `--background-secondary`, `--background-tertiary` when nested, `--separator`, the label colors, and one new radius token, `--radius-box` (0.75rem, INFERRED).
  5. A component is the set of files listed under "The template" below.
- **Why 1**: a box has no behavior. `Group` would add hover and focus-within state and disabled, invalid and read-only flags for styling; HIG Boxes describes none of them (A41), and `Group` does not pass its disabled state to what is inside it (L15). In exchange every box would be a Client Component. D-002 keeps pure markup server-safe and the brief asks for minimal client boundaries. `useId` is one of the five hooks the installed React exports in its server build (L15).
- **Why 2**: the frame is drawn around the content at macOS density and around the title and the content at iOS density, so the component has to own the element around `children`; with compound parts a caller could leave the frame out. It is also the shape of Apple's own API: `GroupBox(_:content:)` and `init(content:label:)` in SwiftUI, `title` and `contentView` on `NSBox` (A42, A43).
- **Why 3**: measured in jsdom (L16): inside `<fieldset disabled>` a React Aria `Button` matches `:disabled` and takes no press, but has no `data-disabled`, so the library's disabled styling would not show. Nothing is lost for assistive technology: `fieldset` maps to the `group` role (STANDARD, W10), which is what the box sets.
- **Why 4**: D-038 item 3, and the contrast of all three label levels on those two backgrounds is already asserted in `contrast.test.ts` for the four color states. The HIG names the two background colors for iOS and iPadOS only; using them at macOS density, the hairline border, the padding, the title style and placing the title inside the box at iOS density are INFERRED.
- **To go back to `Group`**: `Box.tsx` only. It gains `"use client"`, `className` becomes React Aria's string-or-function, and row 5 and the totals in COMPONENT-MAP.md return to what they were.
- **The template** (what the other components would copy):

  | File | What goes in it |
  | --- | --- |
  | `src/<category>/<component>/Box.tsx` | The component and its props type. JSDoc in this order: what it is; server-safe or Client Component, and why; HIG URL; Apple API; ARIA role or APG pattern with its URL, and the keyboard map; what differs by platform; deviations from Apple's behavior; one example |
  | `…/box.styles.ts` | `tv()` with one slot per element. A comment says which choices are VERIFIED and which are INFERRED |
  | `…/Box.test.tsx` | jsdom: naming and roles, structure, controlled and uncontrolled modes where there is state, keyboard, `jest-axe`. Its header says what it cannot see |
  | `…/Box.stories.tsx` | Title `"<Category>/<Export>"`. `Playground` with controls, one story per aspect, and `Theme matrix` (the 18 cells of `ThemeMatrix`) |
  | `…/index.ts` | The public exports of the folder |
  | `src/<category>/index.ts` | Re-exports each folder. No directive. Its comment lists which exports are server-safe and which are Client Components |
  | `src/<category>/server.test.tsx` | Renders the server-safe exports of the category with no DOM |
  | `tests/browser/<category>/<component>.spec.ts` | Chromium and Firefox, only what jsdom cannot see: layout, painted colors, right to left, forced colors |

  Nothing has to be registered for the theme sweep: `stories-axe.spec.ts` picks up every story file and runs axe on it in 13 theme states per engine.
- **Verified**: the figures are in PROGRESS.md, "Batch 1".
- **Not verified**: WebKit; any screen reader; a box on glass or on a material (it stays opaque there, and a translucent fill would need the contrast model extended first).
