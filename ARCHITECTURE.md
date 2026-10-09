# ARCHITECTURE

How the component library is built. Phase 0 plan: nothing here is implemented yet, and nothing was installed.

Evidence labels (VERIFIED, STANDARD, VENDOR, LOCAL, REPORTED, INFERRED) are defined in SOURCES.md section 1. Source IDs such as A20 or W4 point to rows in that file. Decisions are numbered in DECISIONS.md.

## 1. What is in the repository today (LOCAL)

Inspected on 2026-10-08.

| Item | Found |
| --- | --- |
| Framework | `next` 16.4.0, App Router, `app/` at the repository root (no `src/`) |
| React | `react` and `react-dom` 19.3.0, `@types/react` 19.3.0 |
| TypeScript | 5.9.3, `strict: true`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, path alias `@/*` to `./*` |
| Tailwind CSS | `tailwindcss` 4.3.3 with `@tailwindcss/turbopack` 4.3.3, wired as a Turbopack rule for `*.css` in `next.config.ts`. **No PostCSS config** and no `tailwind.config.*` |
| CSS | `app/globals.css`: `@import "tailwindcss"`, two root variables, one `@theme inline` block, dark mode by `prefers-color-scheme` |
| Next config | `cacheComponents: true`, `partialPrefetching: true`, `experimental.agentFeedback: true` |
| Lint | ESLint 9 flat config: `eslint-config-next` core-web-vitals and typescript |
| Tests, playground | **None.** No Vitest, Testing Library, Storybook or Ladle |
| Package manager | pnpm 10.34.6. `pnpm-workspace.yaml` exists but only lists `ignoredBuiltDependencies`; there is no `packages:` entry yet |
| Runtime | Node 24.21.0 on Windows 11 |
| Fonts | `app/layout.tsx` loads Geist and Geist Mono through `next/font/google` |
| App code | The untouched create-next-app page |
| Git | One commit. `PROMPT.md` is untracked; `.gitignore` has an uncommitted line `.PROMPT.md` (leading dot), which does not match `PROMPT.md` |

`AGENTS.md` requires reading `node_modules/next/dist/docs/` before writing code. The guides read for this plan are listed in SOURCES L6.

## 2. Stack

| Concern | Choice | Version seen | Why | Label |
| --- | --- | --- | --- | --- |
| Framework | Next.js App Router, React 19, TypeScript strict | 16.4.0 / 19.3.0 / 5.9.3 | Already in place | LOCAL |
| Styling | Tailwind CSS v4: tokens in `@theme` and CSS variables, glass and materials as `@utility` classes | 4.3.3 | Already in place; the directives exist in v4 docs (L4) | LOCAL, VENDOR |
| Variants | `tailwind-variants` + `tailwind-merge` | 3.3.1 / 3.7.0 | Slots suit compound components; it merges classes through tailwind-merge. the registry entry for `class-variance-authority` was last updated in November 2024 | VENDOR, INFERRED |
| State variants | `tailwindcss-react-aria-components` plugin | 2.2.0 (peer `tailwindcss ^4`) | Short variants (`hovered:`, `pressed:`, `selected:`, `entering:`) for React Aria's data attributes, set up with `@plugin` | VENDOR |
| Behavior and accessibility | `react-aria-components` | 1.22.0 | Required by the brief. Backs 43 of the 64 rows; 20 are custom and 1 is an exception candidate (COMPONENT-MAP.md) | VENDOR |
| Exceptions | Base UI `Menubar` (candidate), Floating UI for selection anchoring | 1.8.0 / 0.27.20 | Only where React Aria has nothing. Register in COMPONENT-MAP.md | VENDOR, INFERRED |
| Icons | `lucide-react` behind `<Icon>` | 1.53.0 (ISC) | Open set. Next.js already optimizes its imports by default (L6) | VENDOR, LOCAL |
| Fonts | System stack only | n/a | SF fonts may not be bundled or used for non-Apple-OS interfaces (A31) | VERIFIED |
| Unit tests | Vitest + Testing Library + `jest-axe`, jsdom | 5.0.3 / 16.3.3 / 11.0.0 / 30.1.2 | Required by the brief; matches the bundled Next.js Vitest guide | LOCAL, VENDOR |
| Playground | Storybook with `@storybook/react-vite` | 10.6.1 | See D-010 | VENDOR, INFERRED |

Not allowed: Radix, SF Symbols, SF fonts, any Apple asset.

## 3. Folder layout

The library is an isolated workspace package, `packages/ui`, published inside the repo as `@caira/ui` and consumed from source (D-001).

```
packages/ui/
  package.json          name, private, sideEffects, exports map (one entry per category)
  tsconfig.json         strict, plus noUncheckedIndexedAccess
  vitest.config.mts
  .storybook/
  src/
    styles/
      index.css         single entry the app imports
      tokens.css        @theme primitives and semantic variables
      materials.css     @utility material-ultrathin | thin | regular | thick
      glass.css         @utility glass-regular | glass-clear | glass-edge | ...
      motion.css
      a11y.css          reduced motion, contrast, forced colors, reduced transparency
    foundations/
      theme/            LiquidGlassProvider, useLiquidGlass, ThemeScript, storage
      glass/            GlassSurface, GlassGroup, GlassFilterDefs, concentric()
      materials/        Material
      icon/             Icon, icon registry
      utils/            tv() setup, cn(), shared types
    content/            Chart, ImageView, TextView, WebView
    layout/
    menus/
    navigation/
    presentation/
    selection/
    status/
    system/
    next/               the only folder that imports from next/* (router adapter)
    test/               setup, axe helper, theme-matrix helper
```

Each component lives in its own folder: `Button.tsx`, `button.styles.ts`, `Button.test.tsx`, `Button.stories.tsx`, `index.ts`. Files stay small; a compound component gets one file per part once it passes roughly 200 lines.

**Tree shaking**

- `exports` exposes one entry per category (`@caira/ui/menus`, `@caira/ui/layout`, ...), plus `@caira/ui/foundations`, `@caira/ui/next` and `@caira/ui/styles.css`. There is **no root barrel**, so importing a button cannot pull in charts.
- `sideEffects` lists only CSS files, as `react-aria-components` itself does (L1).
- Turbopack transpiles workspace packages automatically (L6, `transpilePackages` page), so the package needs no build step.
- If category barrels slow down development, add `@caira/ui` to `experimental.optimizePackageImports` (L6). That is a change to `next.config.ts` and would be raised first.

**Framework independence.** Everything outside `src/next/` is plain React. The router adapter and the theme script are the only Next-aware pieces. This keeps Storybook on the lighter `react-vite` framework and keeps the library testable without Next.

## 4. Server and client boundaries

Fact: every `react-aria-components` export file contains `import "client-only"` (L1). Importing one from a Server Component fails the build. So:

| Kind of file | Directive | Examples |
| --- | --- | --- |
| Anything that imports React Aria, uses a hook, or handles events | `"use client"` at the top | All 43 React Aria-backed components, the 11 custom components that compose React Aria parts, `LiquidGlassProvider`, `GlassGroup`, the toolbar overflow logic, `Window` |
| Pure markup and class names | none (server-safe) | `Icon`, `Material`, static `GlassSurface`, `ThemeScript`, `*.styles.ts`, layout wrappers that do not use React Aria |
| CSS | n/a | tokens, utilities |

Rules:

1. The boundary is the component file, never the category barrel. A barrel with `"use client"` would turn server-safe exports into client ones.
2. `GlassSurface` is server-safe. Its hover, press and focus response comes from CSS and from the data attributes of the control it wraps, not from its own handlers. Only the click "bounce" and morphing need client code, and those live in `GlassGroup` and in the controls.
3. Function props do not cross from a Server Component into a client one. Render-prop `className` functions and event handlers must be written in client files. Each component's docs say so.
4. Every component's JSDoc states whether it is client or server-safe.

## 5. Theming

### 5.1 Token layers (INFERRED design on VENDOR mechanics)

1. **Primitive tokens** in `@theme`: color scales, spacing, radii, type sizes, easing and durations, blur steps, shadows. These create Tailwind utilities.
2. **Semantic variables** on `:root` and on theme selectors: label levels (primary to quaternary, after the vibrancy levels in HIG Materials), fills, separators, accent, surfaces, material and glass parameters. Mapped into Tailwind with `@theme inline`, the pattern `app/globals.css` already uses.
3. **Component variables**, kept few: control height, control radius, bar height.

Values Apple publishes (system color values in HIG Color, type sizes in HIG Typography) will be transcribed in Phase 1 and labelled VERIFIED. Everything Apple does not publish is INFERRED and commented as such in `tokens.css`.

### 5.2 Theme state

State lives on `<html>` so CSS can react without re-rendering React.

| State | Carrier | Values | Source of the default |
| --- | --- | --- | --- |
| Appearance | `data-appearance` | `light`, `dark`; absent means follow `prefers-color-scheme` | System |
| Glass clarity | `--glass-clarity` inline custom property | 0 (fully tinted) to 1 (ultra clear); default 0.5 | The range is VERIFIED (A20). "Medium by default" is REPORTED (P2). The numeric scale is INFERRED |
| Transparency | `data-transparency` | `reduced`; absent means follow the media query where it exists | Manual override is required, see section 7 |
| Contrast | `data-contrast` | `more`; absent means follow `prefers-contrast` | System |
| Motion | `data-motion` | `reduced`; absent means follow `prefers-reduced-motion` | System |
| Platform density | `data-platform` | `macos`, `ios` | `macos` |
| Accent | `--accent` | any color | Token |
| macOS 27 layout options | provider props, mirrored as data attributes | `toolbarStyle: uniform \| floating`, `sidebarStyle: edge-to-edge \| floating`, `windowCorners: uniform \| per-window`, `activeWindowEmphasis: strong \| standard`, `menuIcons: selective \| all` | macOS 27 behavior first in each pair (VERIFIED: A16, A20, A21, A22) |

`<LiquidGlassProvider>` (client) owns these values, exposes them through `useLiquidGlass()`, and persists them in `localStorage` under one key inside `try/catch`.

### 5.3 No flash before hydration (LOCAL)

Following the bundled guide "How to prevent flash before hydration":

- `<ThemeScript>` renders one inline script in `<head>` that reads the stored theme and sets the attributes and `--glass-clarity` before first paint.
- `<html>` gets `suppressHydrationWarning`.
- The provider re-applies the attributes in `useLayoutEffect`, because React Strict Mode resets `<html>` attributes on its development remount.
- The provider's initial state reads the same storage key in a lazy initializer so React and the script agree.
- Under a strict Content Security Policy the inline script needs a nonce.
- The theme is **not** read from `cookies()` or `headers()` in the root layout. The guide warns that doing so opts the app out of static prerendering and, under Cache Components, blocks every segment below.

### 5.4 Dark mode in Tailwind

A `@custom-variant dark` keyed on `data-appearance="dark"`, with the system preference as the default when the attribute is absent. This replaces the media-only block in `app/globals.css` (an existing file; see section 11).

## 6. Liquid Glass on the web

### 6.1 Rules taken from Apple (VERIFIED)

- Glass is for the controls and navigation layer that floats above content. Not for the content layer. The exception is the transient thumb of sliders and toggles (A4).
- The content layer uses standard materials: ultra-thin, thin, regular, thick (A4).
- Two variants: regular and clear. Clear only over visually rich media, with a dark dimming layer of 35% when the content behind is bright (A4).
- Configurable: shape, tint, interactive response; several glass shapes can merge and morph inside a container (A12, A13).
- Use it sparingly in custom controls; limit how many effects are on screen; do not layer glass on glass (A10, A12).
- Corners are concentric with their container (A10, A22).
- Tint the background of the one primary action, not labels; keep labels monochrome over colorful content (A5).
- Glass responds to Reduce Transparency and Increase Contrast (A4, A21).
- macOS 27: stronger diffusion, a darkened edge, brighter specular highlights, user clarity slider (A20, A21).

### 6.2 API surface (INFERRED naming, modelled on A13 to A15)

| Web API | Apple reference | Notes |
| --- | --- | --- |
| `<GlassSurface variant="regular \| clear" tint shape interactive dim>` | `glassEffect(_:in:)`, `Glass`, `NSGlassEffectView` | `shape`: `capsule`, `rounded`, `circle`, `concentric`. `dim` adds the dimming layer for `clear` |
| `<GlassGroup spacing>` with `glassId` on children | `GlassEffectContainer`, `glassEffectID(_:in:)` | Shared-identity morph between surfaces |
| `<Material thickness="ultraThin \| thin \| regular \| thick">` | SwiftUI `Material` | Content layer |
| `concentric(outerRadius, padding)` and a `rounded-concentric` utility | `ConcentricRectangle`, `.containerConcentric` | inner radius = outer radius minus padding, floored at a minimum |
| `<LiquidGlassProvider>` | system settings | Section 5.2 |
| `<GlassFilterDefs>` | n/a | One hidden SVG holding the shared filter definitions, mounted once by the provider |

### 6.3 Rendering tiers (progressive enhancement)

| Tier | What renders | Where | Label |
| --- | --- | --- | --- |
| 0. Solid | Opaque semantic surface, 1 px separator, no blur | Reduced transparency, forced colors, or no `backdrop-filter` support | INFERRED |
| 1. Frosted | `backdrop-filter: blur() saturate() brightness()`, a tint layer, CSS edge highlights (bright top edge, darkened lower edge), a soft shadow | Every supported browser. This is the baseline look | STANDARD support, INFERRED recipe |
| 2. Refractive | Tier 1 plus `backdrop-filter: url(#filter)` using `feDisplacementMap`, and optionally `feSpecularLighting` | **Chromium only today.** WebKit and Firefox do not apply SVG filters through `backdrop-filter` (W7, W8) | STANDARD |

Consequences:

- Safari is where people will compare this to the real thing, and Safari gets tier 1. The design must look right at tier 1; tier 2 is a bonus.
- Detecting tier 2 cannot rely on `@supports` alone, because a browser may parse the value and not render it. The detection method is an open item for Phase 1 (section 12).
- One filter definition is shared by all surfaces. Displacement maps are generated once per shape class, not per element.
- A nested `GlassSurface` detects its parent through context and renders tint only, so glass is never stacked on glass.
- A development-only counter warns when too many glass surfaces are mounted. The budget is set from Phase 1 measurements, not guessed.
- `--glass-clarity` interpolates tint opacity, blur and saturation between a "tinted" and a "clear" endpoint. Both endpoints are INFERRED and tuned by eye.

### 6.4 Morphing

React 19.3 ships `<ViewTransition>`; the types are present in the installed `@types/react` (L8) and the bundled Next.js guide documents it (L6).

- `GlassGroup` gives each surface a transition name and wraps state changes in a transition. Per the guide, plain `setState` does not trigger view transitions; a transition, Suspense or a deferred value does.
- Browsers without the API apply the change instantly. That is the no-animation fallback, at no extra cost.
- React Aria also exports `SharedElementTransition` and `SharedElement` (L1). Phase 1 compares the two and keeps one (D-007).
- Under reduced motion, durations collapse to zero for moving transitions; opacity cross-fades may stay.

## 7. Browser support and fallbacks (STANDARD)

Versions from MDN browser-compat-data 8.1.5 (W4). "Current" on 2026-10-08: Chrome 155, Edge 154, Firefox 157, Safari 27. Global usage from caniuse (W6).

**Baseline: Chrome and Edge 111, Firefox 128, Safari 16.4.** That is Tailwind CSS v4's own floor (L4), so the library cannot go lower without leaving Tailwind v4. Nothing below is required beyond that floor unless the table says so.

| Feature | Chrome / Edge | Firefox | Safari | Used for | Fallback |
| --- | --- | --- | --- | --- | --- |
| `backdrop-filter` (blur, saturate, brightness) | 76 / 79 | 103 (123 on unknown GPUs) | 18 unprefixed; 9 with `-webkit-` | Glass tier 1, materials | Emit both properties. Without support: tier 0 solid. 96.36% global |
| `backdrop-filter: url()` with SVG filters | Works | Not applied | Not applied | Glass tier 2 refraction | Tier 1 |
| SVG `feDisplacementMap`, `feSpecularLighting` | 5 / 12 | 3 | 6 | Filter definitions | Not rendered outside tier 2 |
| View Transitions, same document | 111 | 144 | 18 | Glass morphing, route transitions | Instant change. 91.75% global |
| `view-transition-class` | 125 | 144 | 18.2 | Shared morph styling | Per-name rules |
| `prefers-reduced-motion` | 74 / 79 | 63 | 10.1 | Motion | n/a |
| `prefers-contrast` | 96 | 101 | 14.1 | Higher-contrast theme | Manual `data-contrast` |
| `prefers-reduced-transparency` | 118 | flag only | **No** | Tier 0 switch | **Manual `data-transparency` override is mandatory**; Safari users have no automatic path |
| `forced-colors` media query | 89 / 79 | 89 | 16 | Windows High Contrast | n/a |
| `forced-color-adjust` | 89 / 79 | 113 | **No** | Opting swatches out of forced colors | Avoid depending on it |
| `prefers-color-scheme` | 76 / 79 | 67 | 12.1 | Default appearance | n/a |
| `color-mix()` | 111 | 113 | 16.2 | Tint math | Inside baseline |
| `oklch()` | 111 | 113 | 15.4 | Color scales | Inside baseline |
| `@property` | 85 | 128 | 16.4 | Animating custom properties | Inside baseline |
| `:has()` | 105 | 121 | 15.4 | Local parent styling only | Inside baseline |
| `:focus-visible` | 86 | 85 | 15.4 | Focus rings | Inside baseline |
| Logical properties (`inset-inline-*`) | 87 | 63 | 14.1 | RTL | Inside baseline |
| `@starting-style`, `transition-behavior` | 117 | 129 | 17.5 / 17.4 | Not required: React Aria gives `data-entering` and `data-exiting` | n/a |
| `light-dark()` | 123 | 120 | 17.5 | Not used: the manual override needs attribute selectors anyway | n/a |
| CSS anchor positioning | 125 | 147 | 26 | **Not relied on.** React Aria positions its own overlays; Floating UI covers the one exception | n/a. Mostly partial support (85.91% partial, 0.01% full) |
| `popover` attribute | 114 | 125 | 17 | **Not relied on.** React Aria overlays use portals and their own focus management | n/a |
| `<dialog>` | 37 / 79 | 98 | 15.4 | **Not relied on**, same reason | n/a. 96.77% global |
| `dialog closedby`, `popover="hint"`, `CloseWatcher` | 134 / 151 / 126 | 141 / 153 / 149 | preview only | Not used | n/a |
| Scroll-driven animations (`animation-timeline`) | 115 | preview only | 26 | Scroll edge effect, optional | Scroll listener or `IntersectionObserver` |
| `corner-shape` | 139 | preview only | preview only | Optional smoother corners | `border-radius` |
| `scrollbar-gutter` | 94 | 97 | 18.2 | Stable layout in scroll views | Accept the shift |
| `field-sizing` | 123 | 152 | 26.2 | Auto-growing text views, optional | Scripted resize |
| `accent-color` | 93 | 92 | 26.2 (partial from 15.4) | Not used; controls are custom drawn | n/a |
| Customizable `<select>` (`appearance: base-select`) | 135 | flag only | 27 | Not used; `Select` comes from React Aria | n/a |
| Web Share API | 128 (89 to 127: Windows and ChromeOS only) | flag only | 12.1 | Activity views | Share menu. 89.7% global |
| EyeDropper API | 95 | No | No | Color wells, optional | Hide the button |
| VirtualKeyboard API | 94 | No | No | Not used | n/a |
| Notifications API | 20 | 22 | 7; iOS 16.4 only for installed web apps | Not used; Notifications are in-app toasts | n/a |

## 8. Accessibility strategy

Target: WCAG 2.2 level AA (W2), plus the HIG accessibility guidance (A7).

**By construction**

- Roles, keyboard maps and focus management come from React Aria. Custom components follow the APG pattern named in COMPONENT-MAP.md, and each component's docs cite it.
- States use React Aria's data attributes, which behave the same for mouse, touch and keyboard (L2).
- Focus rings use `:focus-visible` / `data-focus-visible`, with at least 3:1 contrast against adjacent colors (1.4.11) and never clipped by a glass edge.
- Targets: 28 by 28 CSS px at macOS density and 44 by 44 at iOS density (A7). Both exceed the WCAG 2.5.8 minimum of 24 by 24. The 20 by 20 "mini" size from the HIG table is below it and is only allowed with the spacing exception.
- Every drag interaction (sliders, splitters, sheets, reordering, window move and resize) has a keyboard or single-pointer alternative (2.5.7).
- State is never signalled by color alone (1.4.1, A7): selected, on, invalid and destructive states also change shape, icon or text.
- Reduced motion, increased contrast, forced colors and reduced transparency each have an explicit style layer and an explicit story.
- RTL: logical properties only; direction-sensitive icons mirror; locale and direction come from React Aria's `I18nProvider`.

**Contrast over glass.** Text on a translucent surface has no fixed background, so contrast cannot be read from two tokens. Planned method:

1. Each material and glass variant defines a tint floor: a minimum opaque-equivalent layer between any backdrop and the label.
2. A unit test composites that layer over pure white and pure black, the two extreme backdrops, and asserts the label color reaches 4.5:1 (or 3:1 for large text and non-text parts) in both. This is deterministic and runs in Vitest.
3. Browser-level axe runs on stories with adversarial backdrops (photo, white, black) across the theme matrix.
4. The `clear` variant cannot meet step 2 by itself; that is why Apple pairs it with a dimming layer. `clear` without `dim` is documented as "media only, no body text".

Nothing is claimed accessible until its row in PROGRESS.md records the checks that passed.

**What automation cannot cover.** Screen-reader behavior (VoiceOver, NVDA, JAWS, TalkBack) needs a person. I cannot run a screen reader. PROGRESS.md keeps automated checks and manual screen-reader passes in separate columns of evidence, and the manual one stays empty until you or a tester fill it.

## 9. Next.js 16 specifics (LOCAL)

- **Cache Components and Activity.** With `cacheComponents: true`, Next.js hides up to three previous routes with React `<Activity>` instead of unmounting them. State and DOM survive. For this library:
  - Transient overlays (menus, popovers, tooltips, context menus) must close when their route is hidden. The guide's pattern is a `useLayoutEffect` cleanup. React Aria portals overlays to `<body>`, so an open one may otherwise stay visible over the next route. To verify in Phase 1 with a real navigation test.
  - Dialog and sheet open state should be derivable from outside the component (controlled props) so apps can tie it to the URL.
  - No global `:root:has()` selectors. Global state goes through data attributes on `<html>` that one provider owns.
  - Tests must use role-based queries, which skip hidden routes.
- **No request data in the root layout.** React Aria's Next.js setup reads the locale from `headers()` in the root layout (L2). Under Cache Components that makes the shell dynamic. The plan: a static default locale, or a locale route segment, passed to `I18nProvider`.
- **Router integration.** A client `RouterProvider` adapter in `@caira/ui/next` passes `useRouter().push` to React Aria's `RouterProvider` (`navigate`, optional `useHref`: L1). The exact Next.js snippet is no longer in React Aria's docs, so this wiring is INFERRED and gets its own test with `Link`, `Tab href` and `Breadcrumb`.
- **View transitions.** Supported in the App Router with no configuration; `<Link transitionTypes>` exists for directional navigation. Reduced-motion CSS for `::view-transition-*` belongs in `motion.css`.
- **Tailwind pipeline.** CSS goes through the `@tailwindcss/turbopack` loader. Vite-based tools (Vitest, Storybook) do not see that loader and need `@tailwindcss/vite` at the same version. Two integrations of one Tailwind version must be kept in step.
- **Class scanning.** The package sits inside the repository root, so Tailwind's automatic detection should find it; if it does not, the package's `index.css` adds an explicit `@source`. To verify in Phase 1.
- **Fonts.** The library defines its own system stack and does not use `--font-geist-*`. Whether the app keeps Geist is your call (D-012).
- **Icons.** `lucide-react` is in Next's default `optimizePackageImports` list.
- **Docs conflict.** The bundled CSS guide describes the PostCSS plugin while this project uses the Turbopack loader (SOURCES 9.6). Re-check after any Next.js upgrade.

## 10. Testing strategy

| Layer | Tool | What it proves | What it cannot prove |
| --- | --- | --- | --- |
| Unit and interaction | Vitest 5, jsdom, Testing Library, user-event | Rendering, controlled and uncontrolled modes, keyboard map per APG, focus movement, ARIA attributes, callbacks | Layout, real focus rings, colors |
| Structural accessibility | `jest-axe` on every component in every state | axe rules that work without layout (names, roles, relationships) | **Color contrast.** jsdom has no layout or computed color, so axe's contrast rule does not run there |
| Token contrast | Pure-function tests (section 8) | The contrast floor of every material and glass variant | Real backdrops |
| Browser accessibility | axe in a real browser over Storybook stories, across the theme matrix | Contrast, focus visibility, forced-colors rendering | Screen-reader output |
| Visual review | Storybook, by eye in Chrome, Safari and Firefox | Fidelity, tier 1 versus tier 2 | Anything automatic |
| Types and lint | `tsc --noEmit`, ESLint (existing flat config) | No `any`, API shape | n/a |

**Theme matrix** used in stories and browser checks: light, dark × regular, clear, tinted × default, reduced transparency, increased contrast, plus forced colors and RTL. Storybook toolbar globals switch them.

**Definition of done per component** (what lets a PROGRESS.md row say "done"): typed props with no `any`; JSDoc with the HIG link and Apple API; all relevant states; test file passing; `jest-axe` passing; keyboard test matching the cited APG pattern; story covering the theme matrix; browser axe passing on that story; RTL checked.

**Tooling cost to approve.** Browser-level axe needs a real browser driven by Playwright (through Storybook's Vitest integration or `@axe-core/playwright`). That is a dependency beyond the brief's list and a browser download. Without it, contrast can only be checked by the token tests and by eye, and PROGRESS.md would say so. See D-009.

**Version note.** Vitest 5 declares a peer on `@types/node` `^22 || >=24`; the project pins `^20`. Either the package carries its own newer `@types/node` or the root one is raised (an existing-file change).

## 11. Existing files Phase 1 would touch

Phase 0 changed none. Phase 1 cannot avoid these, so they need your approval first:

| File | Change | Why |
| --- | --- | --- |
| `pnpm-workspace.yaml` | Add `packages: ["packages/*"]` (keep `ignoredBuiltDependencies`) | Make `packages/ui` a workspace package |
| `package.json` | Add `@caira/ui` as `workspace:*`; add `test`, `typecheck`, `storybook` scripts | Consume and run the library |
| `app/globals.css` | Import `@caira/ui/styles.css`; replace the media-only dark block | Tokens and utilities |
| `app/layout.tsx` | Add `ThemeScript`, `LiquidGlassProvider`, the router adapter, `suppressHydrationWarning`; decide on Geist | Theme and routing |
| `tsconfig.json` | Possibly exclude the package's stories and tests from the app's type-check | Root `include` matches `**/*.tsx` |
| `eslint.config.mjs` | Ignore Storybook output; optionally add accessibility lint rules for the package | Lint hygiene |
| `.gitignore` | Storybook build and coverage folders | Hygiene |
| `next.config.ts` | Only if needed: `optimizePackageImports`, React Aria's locale-optimization rule | Bundle size |

New dependencies Phase 1 would install (nothing is installed yet): `react-aria-components`, `tailwindcss-react-aria-components`, `tailwind-variants`, `tailwind-merge`, `lucide-react`; dev: `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jest-axe`, `@tailwindcss/vite`, `storybook`, `@storybook/react-vite`, `@storybook/addon-a11y`, and (if approved) Playwright. Base UI and Floating UI are added only when their batch arrives.

## 12. Open items for Phase 1

1. How to detect tier 2 (SVG filter in `backdrop-filter`) reliably.
2. The glass-surface budget, from measurement on a mid-range laptop and a phone.
3. `<ViewTransition>` versus React Aria `SharedElementTransition` for `GlassGroup`.
4. Whether React Aria overlays close on Activity hide by themselves or need the cleanup hook.
5. Whether Tailwind's automatic detection scans `packages/ui`.
6. Transcribing HIG color and typography values into tokens, each marked VERIFIED, and marking the rest INFERRED.
7. The numeric glass recipe (blur, saturation, tint, edge, shadow, clarity curve) and the window corner radius: all INFERRED, tuned visually, with your review of the playground.
8. Reading the pages fetched but not yet read: HIG focus-and-selection, keyboards, pointing-devices, modality, typography tables; WWDC25 sessions 219 and 356; WWDC26 sessions 250 and 292.
