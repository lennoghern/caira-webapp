# SOURCES

Where every design and construction rule in this library comes from.

- **Access date for everything below: 2026-10-08.**
- Phase 0 only. No dependency was installed and no existing file was changed to produce this.
- The library is **inspired by Apple's Human Interface Guidelines**. It is not an Apple product, is not endorsed by Apple, and ships no Apple assets.

## 1. Evidence labels and trust levels

Every claim in the five Phase 0 documents carries one of these labels.

| Label | Meaning | Trust level |
| --- | --- | --- |
| **VERIFIED** | Read in an Apple primary source during this session | Apple primary |
| **STANDARD** | Read in a W3C spec, the APG, MDN, MDN browser-compat-data or caniuse during this session | Web standard |
| **VENDOR** | Read in a library's own docs, type definitions or package metadata during this session | Library primary (not in the original three levels; added because library facts fit none of them) |
| **LOCAL** | Inspected in this repository (`package.json`, configs, `node_modules/next/dist/docs`) | Repository |
| **REPORTED** | Press or third party only. Unverified by Apple docs | Press |
| **INFERRED** | My judgment. Not stated by any source | None |

Rules followed: INFERRED and REPORTED are never presented as verified. Where Apple publishes no number (blur radius, window corner radius, tint opacity), the value the library ends up using is INFERRED and must be labelled so in code comments and docs.

How sources were read: Apple documentation pages were fetched once through their JSON data endpoints and rendered to text locally. WWDC pages, apple.com and support pages were fetched as HTML. Two W3C URLs refused a plain HTTP client (403) and were read through a fetch tool instead. Nothing here comes from memory unless the row says so.

## 2. Apple primary sources

| ID | Source | URL | Used for | Label |
| --- | --- | --- | --- | --- |
| A1 | HIG, Components index | https://developer.apple.com/design/human-interface-guidelines/components | The 8 categories. Scope of the library | VERIFIED |
| A2 | HIG navigation index (JSON) | https://developer.apple.com/tutorials/data/index/design--human-interface-guidelines | Confirmed the count: 4 + 10 + 12 + 5 + 8 + 11 + 4 + 10 = **64** component pages. "Snippets" is one of them (new page, June 8, 2026) | VERIFIED |
| A3 | HIG pages, machine-readable (undocumented endpoint, may change) | `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<slug>.json` | Per page: abstract, platform support, "Developer documentation" links, change log. Fetched for all 64 components and 17 supporting pages (list in section 10). All returned HTTP 200 | VERIFIED |
| A4 | HIG, Materials | https://developer.apple.com/design/human-interface-guidelines/materials | Layering rules, regular and clear variants, 35% dimming guidance, standard materials. Latest change-log entry: September 9, 2025 | VERIFIED |
| A5 | HIG, Color (section "Liquid Glass color") | https://developer.apple.com/design/human-interface-guidelines/color | Tint rules, monochrome default for labels on glass, larger surfaces more opaque. Latest entry: December 16, 2025 | VERIFIED |
| A6 | HIG, Layout | https://developer.apple.com/design/human-interface-guidelines/layout | Scroll edge effect instead of solid bar backgrounds, background extension. Latest entry: September 9, 2026 | VERIFIED |
| A7 | HIG, Accessibility | https://developer.apple.com/design/human-interface-guidelines/accessibility | Contrast table (4.5:1, 3:1), control sizes per platform (macOS 28x28 pt default, 20x20 pt minimum; iOS 44x44 and 28x28), color not the only signal, Reduce Motion | VERIFIED |
| A8 | HIG, Motion, Typography, Dark Mode, Right to left, Icons, SF Symbols, App icons, Designing for macOS | `https://developer.apple.com/design/human-interface-guidelines/<slug>` | Supporting rules for tokens and motion. Typography was fetched but its size tables have not been transcribed into tokens yet (Phase 1) | VERIFIED (fetched), partly unread |
| A9 | HIG, What's new | https://developer.apple.com/design/whats-new/ | Dated list of HIG edits in 2026. Cross-check for the per-page change logs | VERIFIED |
| A10 | Adopting Liquid Glass | https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass | Which components adopt glass, concentric shapes, scroll edge effect, sheets, action sheets, list metrics, "avoid layering glass on glass" | VERIFIED |
| A11 | Liquid Glass (technology overview) | https://developer.apple.com/documentation/technologyoverviews/liquid-glass | Entry page, links to the WWDC25 sessions | VERIFIED |
| A12 | Applying Liquid Glass to custom views | https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views | Shape, tint, interactive, containers, union, morphing transitions (`matchedGeometry`, `materialize`), performance advice | VERIFIED |
| A13 | SwiftUI API reference | `glassEffect(_:in:)`, `Glass` (`regular`, `clear`, `identity`, `tint(_:)`, `interactive(_:)`), `GlassEffectContainer`, `glassEffectID(_:in:)`, `glassEffectUnion(id:namespace:)`, `GlassEffectTransition`, `PrimitiveButtonStyle.glass`, `.glassProminent`, `ConcentricRectangle`, `ScrollEdgeEffectStyle`, `backgroundExtensionEffect()` under https://developer.apple.com/documentation/swiftui/ | Naming and behavior reference for `GlassSurface`, `GlassGroup` and friends | VERIFIED |
| A14 | UIKit API reference | https://developer.apple.com/documentation/uikit/uiglasseffect and `/uiglasscontainereffect` | Properties: `isInteractive`, `tintColor`, `style`, container `spacing` | VERIFIED |
| A15 | AppKit API reference | https://developer.apple.com/documentation/appkit/nsglasseffectview and `/nsglasseffectcontainerview` | Properties: `cornerRadius`, `tintColor`, `style`, `effectIsInteractive`, container `spacing` | VERIFIED |
| A16 | macOS 27 Golden Gate Release Notes | https://developer.apple.com/documentation/macos-release-notes/macos-27-release-notes | **The URL resolves.** AppKit, SwiftUI and UIKit sections read in full for design changes | VERIFIED |
| A17 | macOS Release Notes index | https://developer.apple.com/documentation/macos-release-notes | Lists "macOS 27 Golden Gate Release Notes" and "macOS 27.2 Golden Gate Beta 3 Release Notes" | VERIFIED |
| A18 | AppKit updates, SwiftUI updates | https://developer.apple.com/documentation/updates/appkit and `/updates/swiftui` | June 2026 and September 2026 API additions | VERIFIED |
| A19 | New macOS 27 API pages | `NSMenuItem.preferredImageVisibility` (macOS 27.0), `TabsPickerStyle` (27.0), `NSViewCornerConfiguration` (macOS 27.0), `GeometryProxy.concentricCornerRadii` (27.0), `NSSegmentedControl.role` (macOS 27.0), `EnvironmentValues.accessibilityShowBorders` | Confirmed the pages exist and their availability metadata | VERIFIED |
| A20 | WWDC26 Keynote (session 101), transcript | https://developer.apple.com/videos/play/wwdc2026/101/ | Design passage: diffusion, slider, uniform toolbar, edge-to-edge sidebars, sidebar icon color, uniform window corner radius, app icons | VERIFIED |
| A21 | WWDC26 Platforms State of the Union (session 102), transcript | https://developer.apple.com/videos/play/wwdc2026/102/ | Developer detail for the same changes: darkened edge, brighter specular highlights, scroll edge APIs, menu icons hidden by default, per-item sidebar tint | VERIFIED |
| A22 | WWDC26 "Modernize your AppKit app" (session 289), transcript | https://developer.apple.com/videos/play/wwdc2026/289/ | Chapter "Liquid Glass updates in macOS 27": hard-edge scroll effect under free-floating text, sidebars to the window edge with content still flowing behind, semibold sidebar selection, click "bounce" on glass, `cornerConfiguration` and `.containerConcentric` | VERIFIED |
| A23 | WWDC26 sessions 292, 250, 220, 204 | `https://developer.apple.com/videos/play/wwdc2026/<id>/` ("Design intuitive search experiences", "Principles of great design", "Refine accessibility for custom controls", "What's new in WebKit for Safari 27") | Titles and IDs confirmed. 220 and 204 downloaded and keyword-searched; 292 and 250 downloaded, not read in full | VERIFIED (existence), partly unread |
| A24 | WWDC25 "Meet Liquid Glass" (219), "Get to know the new design system" (356) | https://developer.apple.com/videos/play/wwdc2025/219/ and https://developer.apple.com/videos/play/wwdc2025/356/ | Both URLs resolve and both are linked from HIG Materials. **Transcripts not read this session.** No claim in these documents rests on them | VERIFIED (existence only) |
| A25 | macOS 27 feature page | https://www.apple.com/os/macos/ | Apple's summary sentence of the design refinements | VERIFIED |
| A26 | Apple Support, "What's new in the updates for macOS 27 Golden Gate" | https://support.apple.com/en-us/127257 | Second Apple statement of the design changes | VERIFIED |
| A27 | Mac User Guide (macOS 27), "Change Appearance settings on Mac" | https://support.apple.com/guide/mac-help/change-appearance-settings-mchlp1225/mac | Location of the Liquid Glass slider: System Settings, Appearance, "Liquid Glass". Also "Tint window background with wallpaper color", "Sidebar icon size" | VERIFIED |
| A28 | Mac User Guide (macOS 27), "Change Display settings for accessibility" | https://support.apple.com/guide/mac-help/change-display-settings-for-accessibility-unac089/mac | Increase contrast, Reduce transparency, Differentiate without color, Show toolbar button shapes | VERIFIED |
| A29 | Apple Developer, macOS and "What's new in macOS 27" | https://developer.apple.com/macos/ and https://developer.apple.com/macos/whats-new/ | Fetched. No design specifics beyond links to sessions | VERIFIED (nothing used) |
| A30 | Apple Design Resources | https://developer.apple.com/design/resources/ | Confirmed macOS 27 UI kits exist. **Not downloaded, not used** | VERIFIED (existence only) |
| A31 | Fonts for Apple Platforms, including the San Francisco license text | https://developer.apple.com/fonts/ | License terms, section 7 | VERIFIED |
| A32 | SF Symbols | https://developer.apple.com/sf-symbols/ | Page fetched; the license sentence was not present in the retrieved HTML. See section 7 | VERIFIED (partial) |
| A33 | Apple Website Terms of Use | https://www.apple.com/legal/internet-services/terms/site.html | Content ownership, reproduction and automated-access clauses. Linked as `termsOfUse` in every HIG JSON page | VERIFIED |
| A34 | Guidelines for Using Apple Trademarks and Copyrights | https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html | Referential use of Apple word marks, no Apple logos or icons | VERIFIED |
| A35 | Agreements and Guidelines for Apple Developers | https://developer.apple.com/support/terms/ | Index of agreements. No design-resource license text found on the page | VERIFIED (nothing used) |

## 3. The reported macOS 27 design changes, checked against Apple

All six items in the brief are confirmed by Apple sources. Press is not needed to establish any of them.

| Reported change | Status | Apple evidence | What Apple does **not** publish |
| --- | --- | --- | --- |
| System-wide slider, ultra-clear to fully tinted | **VERIFIED** | A20: "a new slider and settings to adjust Liquid Glass, so you can set it anywhere from ultra clear to fully tinted". A21 adds that apps already using Liquid Glass get it "without even needing to recompile". A25, A26 repeat it. A27 places it at System Settings, Appearance, "Liquid Glass" | The mapping from slider position to blur, opacity or tint. Our `--glass-clarity` curve is INFERRED |
| Improved contrast, more uniform refraction | **VERIFIED** | A25: "more uniform refraction and improved contrast". A20: glass "diffuses complex content behind it much more effectively, while also creating more depth and separation". A21: "a darkened edge along with brighter specular highlights" | Any numeric value |
| Uniform toolbars | **VERIFIED** | A20: "a more uniform toolbar across the top of apps". A21: "When content scrolls under floating bars, a uniform toolbar appears across the top"; automatic for standard toolbars, customizable with the existing scroll edge effect APIs. A22: the automatic style "resolves to a hard-edge effect, when there is free-floating text, like the window title" | Height, opacity, blur of the effect |
| Edge-to-edge sidebars | **VERIFIED** | A20: "sidebars now expand to the very edges of the window" and still show "refractions as content scrolls underneath". A21: "on Mac and iPad". A22: "Sidebars extend to the window's edges ... And content still flows behind them" | Sidebar material opacity |
| Sidebar icon color returning | **VERIFIED** | A20: "Sidebar icons also regain their color". A21: "using your app's accent color", with per-item tint through List and Label APIs. HIG Sidebars, change log June 8, 2026: "Updated guidance for sidebar icon colors" | Nothing material |
| Consistent window corner radius | **VERIFIED** | A20: "every window on macOS now has the same tighter corner radius ... even if they haven't been updated". A21 repeats it | **The radius value.** Ours is INFERRED |
| More prominent active-window distinction | **VERIFIED, narrowly** | Apple ties it to sidebar icon color only. A20: color makes it "easier to ... identify which window is active in the foreground". A21: "making it more clear which window is key" | Any other active-window treatment. P1 quotes the phrase "more prominent active window distinction" as Apple's, but I did not find that wording on an Apple page |
| Selective icons in menu bars and menus | **VERIFIED** | A16 (AppKit): "menu bar and context menus present a reduced set of menu item images ... By default, `NSMenu` hides all menu item symbol images". New `preferredImageVisibility`. SwiftUI and UIKit sections say the same. A21: "icons are hidden by default, there's an API to show icons for key app actions". HIG Menus, change log June 8, 2026 | Nothing material |
| Liquid Glass effects for app icons | **VERIFIED** | A20: "integrating additional layers of Liquid Glass directly into the icon artwork itself". A21: Icon Composer supports multiple glass layers. HIG App icons, change log June 8, 2026 | Not relevant to the component library |

Additional macOS 27 facts found while checking (all VERIFIED, all from A16, A18, A21 or A22):

- New "tabs" role for segmented controls and pickers (`NSSegmentedControl.role`, `TabsPickerStyle`) with "a distinct visual appearance", read by VoiceOver as "tabs".
- Tab views in inspectors now match their appearance in sidebars.
- Disabled checkbox-style toggles are no longer tinted on macOS.
- `.glass` and `.glassProminent` buttons now show a hover state outside toolbars (listed as a fix).
- A new opt-in click response where "the glass subtly bounces", meant for controls only.
- Bordered toolbar items over the sidebar adopt Liquid Glass.
- Sidebar selection uses a semibold text style.
- Concentric corner APIs (`cornerConfiguration`, `.containerConcentric`, `concentricCornerRadii`).
- New toolbar APIs: `visibilityPriority(_:)`, `ToolbarOverflowMenu`, `topBarPinnedTrailing`.
- `TextInputBorderShape` and a `.bordered` text field style; `.squareBorder` and `.roundedBorder` soft-deprecated.
- `LabeledContent` inside a `Menu` maps its value to the menu item's subtitle.

## 4. Web-platform sources

| ID | Source | URL | Used for | Label |
| --- | --- | --- | --- | --- |
| W1 | WAI-ARIA Authoring Practices Guide, Patterns | https://www.w3.org/WAI/ARIA/apg/patterns/ | The 30 patterns and their URLs (listed at the end of COMPONENT-MAP.md). Keyboard maps and roles per component | STANDARD |
| W2 | WCAG 2.2 (W3C Recommendation, 12 December 2024) | https://www.w3.org/TR/WCAG22/ | 1.4.1 Use of Color (A); 1.4.3 Contrast Minimum (AA, 4.5:1 and 3:1 large); 1.4.11 Non-text Contrast (AA, 3:1); 2.4.7 Focus Visible (AA); 2.4.11 Focus Not Obscured (AA); 2.4.13 Focus Appearance (AAA, 2 CSS px perimeter, 3:1); 2.5.7 Dragging Movements (AA); 2.5.8 Target Size Minimum (AA, 24 by 24 CSS px); 2.3.3 Animation from Interactions (AAA) | STANDARD |
| W3 | WAI-ARIA 1.2 | https://www.w3.org/TR/wai-aria-1.2/ | Roles with no APG pattern page (`progressbar`, `status`, `img`, `group`, `timer`). **Not fetched this session** (403 to a plain client, not retried). Cited from memory; re-read before the Status batch | INFERRED until re-read |
| W4 | MDN browser-compat-data, v8.1.5, timestamp 2026-10-08 | https://github.com/mdn/browser-compat-data (data file from https://unpkg.com/@mdn/browser-compat-data@8.1.5/data.json) | Every version number in the browser-support matrix in ARCHITECTURE.md. Current releases per this data: Chrome 155, Edge 154, Firefox 157, Safari 27 (2026-09-14) | STANDARD |
| W5 | MDN Web Docs reference pages | `backdrop-filter`, `feDisplacementMap`, `feSpecularLighting`, View Transition API, `prefers-reduced-motion`, `prefers-contrast`, `prefers-reduced-transparency`, `forced-colors`, CSS anchor positioning, `popover`, `<dialog>`, Web Share API, `corner-shape`, logical properties, EyeDropper API, VirtualKeyboard API, Notifications API under https://developer.mozilla.org/en-US/docs/Web/ | All URLs resolve. Support data taken from W4 (the same data MDN renders), page prose not re-read | STANDARD |
| W6 | caniuse data, updated 2026-10-06 | https://caniuse.com/css-backdrop-filter, https://caniuse.com/view-transitions, https://caniuse.com/css-anchor-positioning (data file from https://github.com/Fyrd/caniuse) | Global usage: backdrop-filter 96.36%, same-document view transitions 91.75%, SVG filters 97.26%, `<dialog>` 96.77%, `:has()` 94.82%, container queries 94.79%, cascade layers 96.03%, Web Share 89.7%, anchor positioning 0.01% full and 85.91% partial | STANDARD |
| W7 | WebKit bug 245510 | https://bugs.webkit.org/show_bug.cgi?id=245510 | Title confirmed: "backdrop-filter: url(#some-svg-filter) doesn't work with SVG filters like feDisplacementMap". Current status not confirmed | STANDARD |
| W8 | mdn/browser-compat-data issue 24110 | https://github.com/mdn/browser-compat-data/issues/24110 | Title confirmed: "css.properties.backdrop-filter - SVG filters not supported in Firefox or Safari". This is why W4 has no sub-entry for it | STANDARD |
| W9 | w3c/svgwg issue 1142 | https://github.com/w3c/svgwg/issues/1142 | Resolves. Per a search summary it asks for an interoperable backdrop displacement. Body not read | REPORTED (summary only) |

## 5. Library and tooling sources

| ID | Source | URL | Used for | Label |
| --- | --- | --- | --- | --- |
| L1 | React Aria Components 1.22.0, type definitions and package files | https://unpkg.com/react-aria-components@1.22.0/ | The exact public exports used in the "primitive used" column. `import "client-only"` in every export file. `sideEffects: ["*.css"]`. License Apache-2.0. `MenuTriggerType = 'press' \| 'longPress' \| 'contextMenu'` (react-stately 3.51.0). `RouterProvider` props `navigate` and `useHref` (react-aria 3.53.0). Peer range accepts React 19 | VENDOR |
| L2 | React Aria docs | https://react-aria.adobe.com/ (`/styling`, `/frameworks`, `/Menu`, `/<Component>`) | Data-attribute list, Tailwind v4 plugin setup (`@plugin "tailwindcss-react-aria-components"`), entering and exiting animation states, Next.js locale setup. Pages are client-rendered and were read through a summarizing fetch, so quotes are second-hand | VENDOR |
| L3 | Base UI 1.8.0, package exports | https://base-ui.com/ and https://unpkg.com/@base-ui/react@1.8.0/package.json | Exports include `menubar`, `context-menu`, `scroll-area`, `otp-field`, `toast`, `drawer`. License MIT. Candidate exceptions only | VENDOR |
| L4 | Tailwind CSS docs | https://tailwindcss.com/docs/functions-and-directives, https://tailwindcss.com/docs/compatibility | `@theme`, `@utility`, `@custom-variant`, `@source`, `@plugin`. Baseline: Chrome 111, Safari 16.4, Firefox 128 | VENDOR |
| L5 | `@tailwindcss/turbopack` README (installed, 4.3.3) | `node_modules/@tailwindcss/turbopack/README.md` | The loader config that `next.config.ts` already uses | LOCAL |
| L6 | Next.js 16.4.0 bundled docs | `node_modules/next/dist/docs/` (CSS, Vitest, view transitions, preventing flash before hydration, preserving UI state, `cacheComponents`, `partialPrefetching`, `optimizePackageImports`, `transpilePackages`, `turbopack`) | Stack and boundary decisions in ARCHITECTURE.md. Read as required by `AGENTS.md` | LOCAL |
| L7 | npm registry metadata | `npm view <pkg>` (read-only) | Current versions, peer ranges and licenses: tailwind-variants 3.3.1 (MIT), tailwind-merge 3.7.0 (MIT), class-variance-authority 0.7.1 (registry entry last updated 2024-11-26), lucide-react 1.53.0 (ISC), tailwindcss-react-aria-components 2.2.0 (Apache-2.0, peer `tailwindcss ^4`), @floating-ui/react 0.27.20 (MIT), vitest 5.0.3 (MIT), jsdom 30.1.2, @testing-library/react 16.3.3, @testing-library/user-event 14.6.7, jest-axe 11.0.0 (MIT), axe-core 4.14.0, storybook 10.6.1 (MIT), @storybook/react-vite 10.6.1, @storybook/nextjs-vite 10.6.1 (peer `next ^14.1 \|\| ^15 \|\| ^16`), @ladle/react 5.1.1 (registry entry last updated 2025-11-04), @tailwindcss/vite 4.3.3, @playwright/test 1.64.0 | VENDOR |
| L8 | Installed type definitions | `node_modules/@types/react` 19.3.0 | `ViewTransition` and `Activity` are exported from the stable React types | LOCAL |

## 6. Press (REPORTED, unverified by Apple docs)

Used only for details Apple does not document. Each item below is **reported, unverified by Apple docs**.

| ID | Source | URL | What it adds | Label |
| --- | --- | --- | --- | --- |
| P1 | 9to5Mac, Zac Hall, June 9, 2026 | https://9to5mac.com/2026/06/09/macos-27-golden-gate-includes-these-changes-that-tahoe-critics-will-appreciate/ | Author's observation of the beta: window shape consistent across all apps without app updates; submenus use far fewer icons. Quotes Apple as saying "more prominent active window distinction" and "the return of sidebar icon color" | REPORTED |
| P2 | 9to5Mac, Zac Hall, September 22, 2026 | https://9to5mac.com/2026/09/22/macos-27-gives-you-more-control-over-liquid-glass/ | The slider has three notches (most clear, medium, most opaque) with free positions between; default is medium; it also drives the Dock, widgets, sidebars, toolbars and toolbar buttons; setup invites you to adjust it | REPORTED |
| P3 | MacRumors, Hartley Charlton, June 10, 2026 | https://www.macrumors.com/2026/06/10/how-liquid-glass-is-changing-in-ios-27/ | Restates the keynote and State of the Union. Adds nothing beyond A20 and A21 | REPORTED |

Search also surfaced Cult of Mac, MacStories, Stuff, AppleMagazine, iGeeksBlog and forum threads. None was opened and none is used. One forum claim, that colored sidebar icons appear only for the active app, is consistent with A20 and A21 but is not something Apple states in those words.

## 7. Licenses and terms (summary, not legal advice)

| Item | What the source says | Consequence for this library | Label |
| --- | --- | --- | --- |
| San Francisco fonts | A31: licensed "solely for creating mock-ups of user interfaces to be used in software products running on Apple's iOS, OS X or tvOS operating systems". The license forbids mock-ups for non-Apple operating systems and forbids embedding the font in software | **Never bundle or link SF fonts.** Use a system font stack. On Apple devices `system-ui` resolves to the installed system font without any file being shipped | VERIFIED |
| SF Symbols | HIG SF Symbols page: there is a "prohibition against using symbols — or images that are confusingly similar — in app icons, logos, or any other trademarked use". The same page says Apple products cannot be reproduced in custom symbols. The full license text was not in the HTML retrieved from A32 | **No SF Symbols, and no redrawn look-alikes.** Icons come from an open set (Lucide, ISC) behind `<Icon>` | VERIFIED (HIG wording), full license not retrieved |
| HIG text, images, artwork | A33: site content, including "look and feel", is owned by Apple; "no part of the Site and no Content may be copied, reproduced, republished ... without Apple's express prior written consent". Every HIG JSON page carries "Copyright © 2026 Apple Inc. All rights reserved." | Do not paste HIG prose, screenshots or artwork into the repo, the docs or the playground. Link to the HIG page and describe rules in our own words. Short attributed quotes appear only in this file | VERIFIED |
| Automated access to apple.com and developer.apple.com | A33: no "deep-link", "page-scrape", "robot", "spider" or other automatic means "to access, acquire, copy or monitor any portion of the Site" | The JSON endpoint named in the brief was read **once, by hand-driven requests, for research**. It must not become a build step, a CI job or a scheduled sync. See D-022 | VERIFIED |
| Apple Design Resources (UI kits, templates, bezels) | License terms were not found on the web page (A30) and the kits were not downloaded | Treat as off limits. Nothing is traced or exported from them | VERIFIED (not used) |
| Apple trademarks | A34: Apple word marks may appear in a referential phrase such as "compatible with" if there is no suggestion of endorsement; Apple logos and Apple-owned icons may not be used without a license | Describe the library as "inspired by Apple's Human Interface Guidelines". No Apple logo, no Apple app icons, no wallpapers. Do not name the package or its components after Apple trademarks. Window controls must be our own drawing | VERIFIED |
| Trade dress | A33 lists "look and feel" among protected content of the site | Reproducing Apple's visual language on the web is the stated goal of the project and is your decision. If the library is ever published or sold, get legal review first | VERIFIED (clause), INFERRED (advice) |
| Open-source dependencies | L1, L3, L7: Apache-2.0 (React Aria Components, its Tailwind plugin), MIT (Base UI, Floating UI, tailwind-variants, tailwind-merge, Vitest, jest-axe, Storybook), ISC (Lucide) | All compatible with a private app. Keep license notices if the package is distributed | VENDOR |

## 8. Unreachable, changed or not verified

- **Apple Newsroom press release for macOS 27**: not found. A search restricted to apple.com returned the feature page (A25) and support pages (A26, A27) but no June 2026 press release about design. The phrase "more prominent active window distinction" therefore has no Apple page behind it here.
- **macOS 27 public release date**: not confirmed on an Apple page. INFERRED as mid-September 2026 from: the release notes are no longer labelled beta, a 27.2 beta is listed (A17), Safari 27 is dated 2026-09-14 in W4, and A26 describes "updates for macOS 27". The brief's "expected fall 2026" is out of date.
- **WWDC25 sessions 219 and 356**: URLs verified, content not read (A24).
- **"Landmarks: Building an app with Liquid Glass"** sample: URL resolves, not read.
- **SF Symbols license text** and **Apple Design Resources license**: not retrieved (section 7).
- **W3C pages** return 403 to a plain HTTP client. The APG index and WCAG 2.2 were read through a fetch tool; WAI-ARIA 1.2 was not read.
- **React Aria docs** are client-rendered. Facts taken from them were cross-checked against the package's type definitions where it mattered (context-menu trigger, `RouterProvider`, sheet snap points, tree columns in `Table`).
- **React Aria + Next.js router snippet**: the current `/frameworks` page shows locale setup for Next.js but no `RouterProvider` example. The old routing URL redirects there. The wiring in ARCHITECTURE.md is INFERRED from the verified prop types.
- **Numeric Liquid Glass specs** (blur radius, saturation, refraction strength, edge highlight, corner radii, slider curve): Apple publishes none in the sources read. Every such number in this library will be INFERRED.
- **HIG typography tables** were fetched but not yet transcribed.

## 9. Discrepancies between sources

1. **Sidebars.** The HIG Sidebars page still says sidebars "can float above content in the Liquid Glass layer", even after its June 8, 2026 edit. The keynote, the State of the Union and session 289 say sidebars extend to the window edges in macOS 27. The library follows the WWDC26 statements for the macOS 27 theme and keeps the floating style as an option.
2. **HIG pages not updated for macOS 27.** The brief asked whether Materials, Color, Toolbars, Sidebars, Windows, Menus and The menu bar changed. By change log: **Menus** (June 8, 2026), **Sidebars** (June 8, 2026) changed. **Materials** (last entry September 9, 2025), **Color** (December 16, 2025), **Toolbars** (December 16, 2025), **Windows** (June 9, 2025) and **The menu bar** (June 9, 2025) have no 2026 entry. Also changed on June 8, 2026: Scroll views, Tab bars, Search fields, App icons, App Shortcuts, and the new Snippets page. Sheets and Scroll views changed on March 24, 2026.
3. **Dimming under clear glass.** HIG Materials says 35% dark dimming over bright content. The SwiftUI `Glass.clear` page shows an example with black at 30%. The library uses 35% as the default and exposes it as a token.
4. **Slider scope.** The Mac User Guide (A27) describes the Liquid Glass slider as adjusting "the appearance of app icons". The keynote and A25 describe it as adjusting Liquid Glass generally.
5. **`accessibilityShowBorders`.** Its reference page lists macOS 11.0 availability; the State of the Union says macOS 27 "now" supports the show-borders environment value.
6. **Tailwind integration in Next.js docs.** The bundled CSS guide documents `@tailwindcss/postcss`. This project instead uses the `@tailwindcss/turbopack` loader from `next.config.ts`, exactly as that loader's README shows, while the bundled Turbopack page says loaders that transform stylesheets are not supported. The project builds this way today; treat it as the source of truth and re-check on every Next.js upgrade.

## 10. HIG pages fetched (A3)

Components (64): charts, image-views, text-views, web-views, boxes, collections, column-views, disclosure-controls, labels, lists-and-tables, lockups, outline-views, split-views, tab-views, activity-views, buttons, context-menus, dock-menus, edit-menus, home-screen-quick-actions, menus, ornaments, pop-up-buttons, pull-down-buttons, the-menu-bar, toolbars, path-controls, search-fields, sidebars, tab-bars, token-fields, action-sheets, alerts, page-controls, panels, popovers, scroll-views, sheets, windows, color-wells, combo-boxes, digit-entry-views, image-wells, pickers, segmented-controls, sliders, steppers, text-fields, toggles, virtual-keyboards, activity-rings, gauges, progress-indicators, rating-indicators, app-shortcuts, complications, controls, live-activities, notifications, snippets, status-bars, top-shelf, watch-faces, widgets.

Supporting (17): materials, color, layout, typography, motion, accessibility, icons, sf-symbols, app-icons, dark-mode, right-to-left, designing-for-macos, designing-for-iphone-duo, focus-and-selection, keyboards, pointing-devices, modality. (focus-and-selection, keyboards, pointing-devices and modality were downloaded but not read yet.)

Each page URL is `https://developer.apple.com/design/human-interface-guidelines/<slug>`.

## 11. Phase 1 additions (accessed 2026-10-08)

Sections 1 to 10 are the Phase 0 record and are unchanged. Rows below were added while building the foundations.

| ID | Source | URL | Used for | Label |
| --- | --- | --- | --- | --- |
| A36 | HIG Color, "Specifications" | https://developer.apple.com/design/human-interface-guidelines/color | **Transcribed**: the 12 system colors and the 6 iOS, iPadOS system grays, each in four columns (default light, default dark, increased contrast light, increased contrast dark). The values are in the alt text of the swatch images. In `tokens.css`, guarded by `tokens.test.ts`. The page publishes no values for labels, fills, separators or backgrounds | VERIFIED |
| A37 | HIG Typography, "Specifications" | https://developer.apple.com/design/human-interface-guidelines/typography | **Transcribed**: "macOS built-in text styles" and "iOS, iPadOS Dynamic Type sizes", tab "Large (default)": size, line height or leading, weight. Read but not used: emphasized weights; the tracking tables (the page says to adjust tracking "in interface mockups" and that "in a running app, the system font dynamically adjusts tracking"). Also read: default and minimum sizes per platform | VERIFIED |
| A38 | HIG Materials, read in full | https://developer.apple.com/design/human-interface-guidelines/materials | Confirms the Phase 0 summary (A4): glass for controls and navigation only; regular and clear; "a dark dimming layer of 35% opacity"; four standard materials; label, fill and separator vibrancy levels by name. No numeric value besides the 35% | VERIFIED |
| A39 | HIG Motion, read in full | https://developer.apple.com/design/human-interface-guidelines/motion | Principles only: purposeful, brief, optional, "let people cancel motion". No duration or easing curve is published, so every motion token is INFERRED. Used in D-027 | VERIFIED |
| A40 | HIG Layout, scanned for numbers | https://developer.apple.com/design/human-interface-guidelines/layout | No spacing scale and no corner radius. The only figures are tvOS safe-area margins and a visionOS control spacing, neither used | VERIFIED (nothing used) |
| R1 | React blog, "React v19" | https://react.dev/blog/2024/12/05/react-19 | "Starting in React 19, you can now access `ref` as a prop for function components"; "In future versions we will deprecate and remove `forwardRef`". Read through a summarizing fetch, so the quotes are second-hand; the behavior itself is covered by unit tests | VENDOR |
| L9 | lucide-react 1.53.0, installed files | `packages/ui/node_modules/lucide-react/dist/esm/Icon.mjs`, `context.mjs` | Both start with `"use client"`; the base icon reads a context. `sideEffects: false`. D-029 | LOCAL |
| L10 | react-aria-components 1.22.0, installed files | `dist/private/SharedElementTransition.mjs`, `dist/types/src/SharedElementTransition.d.ts`; react-aria 3.53.0 `dist/types/src/utils/openLink.d.ts` | How `SharedElementTransition` works (it snapshots the rectangle and the transitioning properties when an element unmounts, and animates the next element with the same name from them); `RouterProvider` takes `navigate` and optional `useHref`. D-027, the Next.js adapter | LOCAL |
| L11 | React 19.3.0, installed | `node_modules/react` | `ViewTransition`, `addTransitionType` and `Activity` are exported by the installed package | LOCAL |
| L12 | Next.js 16.4.0 bundled docs, read again in Phase 1 | `node_modules/next/dist/docs/01-app/` (preventing flash before hydration, preserving UI state, view transitions, Vitest, CSS, fonts, `transpilePackages`, `optimizePackageImports`) and the `@tailwindcss/turbopack` README | Inline theme script and `suppressHydrationWarning`; the layout-effect re-apply for Strict Mode; view transitions need a transition; hit-testing skips named participants during a view transition; workspace packages are transpiled automatically | LOCAL |
| L13 | Measurements on this machine | `packages/ui/tests/browser/*.spec.ts`, results in PROGRESS.md | Painted pixels against the contrast model in Chromium and Firefox; what Firefox does with an SVG filter in `backdrop-filter`; frame times; view transition behavior; that Playwright's Firefox screenshots omit `backdrop-filter` | LOCAL |
| L14 | oxc-resolver 11.21.2, installed files and the error it raised | `node_modules/.pnpm/oxc-resolver@11.21.2/.../index.js` | Storybook depends on it; its Windows native module is unsigned and is blocked by Smart App Control here; the package lists `@oxc-resolver/binding-wasm32-wasi` as an optional fallback loaded when `NAPI_RS_FORCE_WASI` is set or the native load fails. D-024 | LOCAL |

Additions to section 8 (not verified):

- **Labels, fills, separators, backgrounds.** The INFERRED values in `tokens.css` began from the UIKit dynamic colors as I remember them and were then changed where the contrast tests required. No Apple page was read for them, and they are not Apple's values.
- **WebKit behavior**: nothing in Phase 1 ran in WebKit.
- **Why Playwright's Firefox screenshots omit `backdrop-filter`**: observed, cause not looked up.
- **The WAI-ARIA 1.2 specification** (W3) is still unread.
