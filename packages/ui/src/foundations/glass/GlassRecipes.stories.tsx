import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CLEAR_CLARITY,
  DEFAULT_CLARITY,
  EDGE_ON_DEFAULT,
  GLASS_RECIPES,
  describeVerdict,
  recipeFilterId,
  recipeStyle,
  recipeVerdict,
  type GlassRecipe,
  type RecipeAppearance,
} from "../../test/glass-recipes";
import { Backdrop } from "../../test/story-kit";
import { Icon } from "../icon/Icon";
import { LiquidGlassScope } from "../theme/LiquidGlassScope";
import { useLiquidGlass } from "../theme/context";
import type { StyleWithVars } from "../utils/types";
import { GlassFilterDefs } from "./GlassFilterDefs";
import { GlassSurface } from "./GlassSurface";
import { glassSurface } from "./glass.styles";

/**
 * Not documentation of a component: side-by-side looks for regular glass, so a
 * change can be chosen by eye before it becomes the default. Recipe 2 was chosen
 * this way on 2026-10-09. The recipes and their contrast verdicts live in
 * src/test/glass-recipes.ts.
 */
const meta = {
  title: "Foundations/Glass recipes",
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ROWS = [
  { backdrop: "stripes", clarity: DEFAULT_CLARITY, label: "Stripes", setting: "default (0.5)" },
  { backdrop: "photo", clarity: DEFAULT_CLARITY, label: "Photo", setting: "default (0.5)" },
  { backdrop: "stripes", clarity: CLEAR_CLARITY, label: "Stripes", setting: "clear end (1)" },
  { backdrop: "photo", clarity: CLEAR_CLARITY, label: "Photo", setting: "clear end (1)" },
] as const;

const GRID = "grid grid-cols-[6.5rem_repeat(5,minmax(11.5rem,1fr))] gap-2";

function Sample({ recipe, appearance, clarity, plain }: { recipe: GlassRecipe; appearance: RecipeAppearance; clarity: number; plain: boolean }) {
  return (
    // `contents`: the wrapper only carries the recipe's custom properties down.
    <div className="contents" style={plain ? undefined : recipeStyle(recipe, appearance, clarity)}>
      <GlassSurface shape="capsule" size="small" className="flex items-center gap-2 px-3 py-1.5 text-body">
        <Icon name="search" />
        <span>Label</span>
        <span className="text-label-secondary">Secondary</span>
      </GlassSurface>
      <GlassSurface className="w-40 px-3 py-2.5">
        <p className="text-headline">Panel title</p>
        <p className="text-footnote text-label-secondary">Secondary text on glass</p>
      </GlassSurface>
    </div>
  );
}

function Verdict({ recipe, appearance }: { recipe: GlassRecipe; appearance: RecipeAppearance }) {
  const lines = [
    ["Default", recipeVerdict(recipe, appearance, DEFAULT_CLARITY)],
    ["Clear end", recipeVerdict(recipe, appearance, CLEAR_CLARITY)],
  ] as const;
  return (
    <div className="rounded-lg bg-background-secondary p-2 text-caption1 text-label">
      <dl>
        {lines.map(([setting, verdict]) => (
          <div key={setting} className="mb-1.5 last:mb-0">
            <dt className="font-semibold">{setting}</dt>
            <dd>Over black: {describeVerdict(verdict.black)}</dd>
            <dd>Over white: {describeVerdict(verdict.white)}</dd>
          </div>
        ))}
      </dl>
      {recipe.notModelled ? <p className="mt-1.5 text-label-secondary">{recipe.notModelled}</p> : null}
    </div>
  );
}

function Board({ appearance, plain }: { appearance: RecipeAppearance; plain: boolean }) {
  return (
    <LiquidGlassScope appearance={appearance} className="rounded-2xl bg-background p-3">
      <h2 className="mb-2 text-title3 font-semibold">{appearance === "light" ? "Light appearance" : "Dark appearance"}</h2>
      <div className="overflow-x-auto">
        <div className="min-w-[70rem]">
          <div className={GRID}>
            <span />
            {GLASS_RECIPES.map((recipe) => (
              <div key={recipe.id} className="pb-1">
                <h3 className="text-headline">{recipe.name}</h3>
                <p className="text-caption1 text-label-secondary">{recipe.summary}</p>
              </div>
            ))}
          </div>
          {ROWS.map((row) => (
            <div key={`${row.backdrop}-${row.clarity}`} className={`${GRID} mt-2`}>
              <p className="self-center text-footnote">
                <strong className="block">{row.label}</strong>
                <span className="text-label-secondary">{row.setting}</span>
              </p>
              {GLASS_RECIPES.map((recipe) => (
                <Backdrop
                  key={recipe.id}
                  kind={row.backdrop}
                  data-recipe={recipe.id}
                  data-row={`${row.backdrop}-${row.clarity}`}
                  className="flex h-40 flex-col items-center justify-center gap-2.5 rounded-xl"
                >
                  <Sample recipe={recipe} appearance={appearance} clarity={row.clarity} plain={plain} />
                </Backdrop>
              ))}
            </div>
          ))}
          <div className={`${GRID} mt-2`}>
            <p className="text-footnote">
              <strong className="block">Contrast</strong>
              <span className="text-label-secondary">4.5:1 labels, 3:1 tertiary</span>
            </p>
            {GLASS_RECIPES.map((recipe) => (
              <Verdict key={recipe.id} recipe={recipe} appearance={appearance} />
            ))}
          </div>
        </div>
      </div>
    </LiquidGlassScope>
  );
}

function RefractionNote({ what }: { what: string }) {
  const { refraction } = useLiquidGlass();
  return (
    <p className="mt-2 text-callout">
      Refraction (the bent rim, Chromium with a GPU only) is <strong>{refraction ? "on" : "off"}</strong> in this browser
      {refraction ? "." : `. ${what}`}
    </p>
  );
}

function ComparisonBoards() {
  const { resolved } = useLiquidGlass();
  // Increased contrast keeps its own, more opaque values whichever recipe is chosen.
  const plain = resolved.increasedContrast;
  return (
    <div className="grid gap-4 p-4">
      <header className="max-w-prose">
        <h1 className="text-title2 font-semibold">Glass recipes</h1>
        <p className="text-callout text-label-secondary">
          Looks for regular glass over the same two backdrops, in both appearances. Rows one and two are the default
          setting of the clarity slider; rows three and four are its clear end. Recipe 2 is the default, chosen from
          this page on 2026-10-09; the others are what it was chosen against. Recipe 6 was discarded and removed. The
          Glass switch in the toolbar does not apply here: each cell sets its own clarity.
        </p>
        <RefractionNote what="Recipes 4 and 5 differ from the others mostly in that rim, so turn it on to judge them." />
        {plain ? (
          <p className="mt-2 text-callout">
            Increased contrast is on, so every cell shows the same increased-contrast glass. Turn it off to compare the
            recipes.
          </p>
        ) : null}
        <p className="mt-2 text-callout text-label-secondary">
          The contrast row is computed from each recipe, with the same floors the test suite asserts for the shipped
          tokens. It checks primary, secondary and tertiary labels over a pure black and a pure white backdrop, in
          every interaction state. A recipe that fails over one of them is not legible on every background.
        </p>
      </header>
      {/* One filter per recipe that brings its own rim. */}
      {GLASS_RECIPES.filter((recipe) => recipe.refraction).map((recipe) => (
        <GlassFilterDefs key={recipe.id} id={recipeFilterId(recipe)} {...recipe.refraction} />
      ))}
      <Board appearance="light" plain={plain} />
      <Board appearance="dark" plain={plain} />
    </div>
  );
}

export const Comparison: Story = {
  render: () => <ComparisonBoards />,
};

/* ---- A trial: the asymmetric edge on the default ------------------------------------------ */

const EDGE_BACKDROPS = [
  ["stripes", "Stripes"],
  ["photo", "Photo"],
  ["content", "App content"],
] as const;

/** Only the edge and the rim change; the fill is whatever ships, at whatever the toolbar says. */
function edgeTrialStyle(appearance: RecipeAppearance): StyleWithVars {
  return {
    "--glass-edge": EDGE_ON_DEFAULT[appearance].edge,
    "--glass-refraction-filter": `url("#${recipeFilterId(EDGE_ON_DEFAULT)}")`,
  };
}

function EdgeSample({ label }: { label: string }) {
  return (
    <>
      <GlassSurface as="nav" aria-label={label} shape="capsule" className="flex items-center gap-3 px-4 py-2 text-body">
        <Icon name="sidebar" />
        <span className="font-semibold">Title</span>
        <span className="text-label-secondary">Secondary</span>
        <Icon name="search" />
      </GlassSurface>
      <div className="flex items-center gap-3">
        <GlassSurface className="w-48 px-4 py-3">
          <p className="text-headline">Panel title</p>
          <p className="text-footnote text-label-secondary">Secondary text on glass, two lines of it to fill the panel.</p>
        </GlassSurface>
        <button
          type="button"
          aria-label={`${label}: add`}
          data-glass="regular"
          className={glassSurface({ size: "small", shape: "circle", interactive: true, class: "grid size-11 place-items-center" })}
        >
          <Icon name="add" />
        </button>
      </div>
    </>
  );
}

function EdgeBoard({ appearance, plain }: { appearance: RecipeAppearance; plain: boolean }) {
  return (
    <LiquidGlassScope appearance={appearance} className="rounded-2xl bg-background p-3">
      <h2 className="mb-2 text-title3 font-semibold">{appearance === "light" ? "Light appearance" : "Dark appearance"}</h2>
      <div className="grid grid-cols-[5.5rem_repeat(2,minmax(18rem,1fr))] gap-2">
        <span />
        <h3 className="text-headline">Default edge (ships)</h3>
        <h3 className="text-headline">Asymmetric edge (trial)</h3>
        {EDGE_BACKDROPS.map(([kind, label]) => (
          <div key={kind} className="contents">
            <p className="self-center text-footnote font-semibold">{label}</p>
            {(["default", "asymmetric"] as const).map((edge) => (
              <Backdrop
                key={edge}
                kind={kind}
                data-edge={edge}
                data-backdrop-kind={kind}
                className="flex h-56 flex-col items-center justify-center gap-4 rounded-xl"
              >
                <div className="contents" style={edge === "asymmetric" && !plain ? edgeTrialStyle(appearance) : undefined}>
                  <EdgeSample label={`${appearance}, ${label}, ${edge} edge`} />
                </div>
              </Backdrop>
            ))}
          </div>
        ))}
      </div>
    </LiquidGlassScope>
  );
}

function EdgeTrial() {
  const { resolved } = useLiquidGlass();
  const plain = resolved.increasedContrast;
  const verdict = (appearance: RecipeAppearance) => recipeVerdict(EDGE_ON_DEFAULT, appearance, DEFAULT_CLARITY);
  return (
    <div className="grid gap-4 p-4">
      <header className="max-w-prose">
        <h1 className="text-title2 font-semibold">{EDGE_ON_DEFAULT.name}</h1>
        <p className="text-callout text-label-secondary">
          A trial, not the default. Left: the glass that ships. Right: the same glass with the rim from recipe 5, a
          bright reflection along the top edge, a soft shadow along the bottom edge, and the refraction light moved to
          straight above. Nothing else differs, and the Glass, Transparency and Refraction switches in the toolbar apply
          to both columns.
        </p>
        <RefractionNote what="Without it only the reflection and the shadow differ; the rim is the same on both sides." />
        {plain ? (
          <p className="mt-2 text-callout">
            Increased contrast is on. It replaces every edge with a plain outline, so both columns are the same.
          </p>
        ) : null}
        <p className="mt-2 text-callout text-label-secondary">
          Contrast in the body of the surface is that of the default, because the fill is the same: over black{" "}
          {describeVerdict(verdict("light").black)} in light and {describeVerdict(verdict("dark").black)} in dark; over
          white {describeVerdict(verdict("light").white)} and {describeVerdict(verdict("dark").white)}. Not modelled:
          the glow and the shadow reach about 10 px in from the top and bottom edges, and text placed there would sit
          on a lighter or darker band.
        </p>
      </header>
      <GlassFilterDefs id={recipeFilterId(EDGE_ON_DEFAULT)} {...EDGE_ON_DEFAULT.refraction} />
      <EdgeBoard appearance="light" plain={plain} />
      <EdgeBoard appearance="dark" plain={plain} />
    </div>
  );
}

export const AsymmetricEdge: Story = {
  name: "Asymmetric edge on the default",
  render: () => <EdgeTrial />,
};
