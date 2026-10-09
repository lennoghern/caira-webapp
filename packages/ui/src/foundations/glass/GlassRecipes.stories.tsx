import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CLEAR_CLARITY,
  DEFAULT_CLARITY,
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
import { GlassFilterDefs } from "./GlassFilterDefs";
import { GlassSurface } from "./GlassSurface";

/**
 * Not documentation of a component: a side-by-side of candidate looks for
 * regular glass, so one can be chosen by eye before any default changes.
 * The recipes and their contrast verdicts live in src/test/glass-recipes.ts.
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

const GRID = "grid grid-cols-[6.5rem_repeat(6,minmax(11.5rem,1fr))] gap-2";

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
        <div className="min-w-[82rem]">
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

function ComparisonBoards() {
  const { refraction, resolved } = useLiquidGlass();
  // Increased contrast keeps its own, more opaque values whichever recipe is chosen.
  const plain = resolved.increasedContrast;
  return (
    <div className="grid gap-4 p-4">
      <header className="max-w-prose">
        <h1 className="text-title2 font-semibold">Glass recipes</h1>
        <p className="text-callout text-label-secondary">
          Six looks for regular glass over the same two backdrops, in both appearances. Rows one and two are the default
          setting of the clarity slider; rows three and four are its clear end. Nothing here is the default yet except
          recipe 1. The Glass switch in the toolbar does not apply to this page: each cell sets its own clarity.
        </p>
        <p className="mt-2 text-callout">
          Refraction (the bent rim, Chromium with a GPU only) is <strong>{refraction ? "on" : "off"}</strong> in this
          browser{refraction ? "" : ". Recipes 4, 5 and 6 differ from the others mostly in that rim, so turn it on to judge them"}.
        </p>
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
