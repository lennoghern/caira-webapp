import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { composeStory, formatGlobals, globalTypes, parseGlobals, stories, type StoryEntry } from "./stories";

const params = new URLSearchParams(window.location.search);
const storyId = params.get("id");
const globals = parseGlobals(params.get("globals"));
// Composed once, outside render: a component must not be created while rendering.
const Story = storyId ? composeStory(storyId, globals) : null;

function href(id: string | null, nextGlobals: Record<string, string>): string {
  const query = new URLSearchParams();
  if (id) query.set("id", id);
  const formatted = formatGlobals(nextGlobals);
  if (formatted) query.set("globals", formatted);
  const text = query.toString();
  return text ? `?${text}` : "./";
}

/** The toolbar switches from .storybook/preview.tsx, as plain links. */
function Globals({ id }: { id: string | null }) {
  return (
    <dl className="grid gap-x-4 gap-y-1 text-callout sm:grid-cols-[auto_1fr]">
      {Object.entries(globalTypes).map(([key, type]) => {
        const toolbar = type.toolbar as { title?: string; items?: { value: string; title: string }[] } | undefined;
        return (
          <div key={key} className="contents">
            <dt className="text-label-secondary">{toolbar?.title ?? key}</dt>
            <dd className="flex flex-wrap gap-x-3">
              {(toolbar?.items ?? []).map((item) =>
                globals[key] === item.value ? (
                  <strong key={item.value} aria-current="true">
                    {item.title}
                  </strong>
                ) : (
                  <a key={item.value} href={href(id, { ...globals, [key]: item.value })} className="text-accent-text underline">
                    {item.title}
                  </a>
                ),
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function Index() {
  const groups = new Map<string, StoryEntry[]>();
  for (const story of stories) groups.set(story.title, [...(groups.get(story.title) ?? []), story]);
  return (
    <main className="mx-auto grid max-w-3xl gap-6 p-6 text-body text-label">
      <header>
        <h1 className="text-title1 font-semibold">@caira/ui stories</h1>
        <p className="text-label-secondary">
          The Storybook stories, rendered without the Storybook application. For browser tests, and as a stand-in
          playground where Storybook cannot run.
        </p>
      </header>
      <section aria-labelledby="theme-heading">
        <h2 id="theme-heading" className="text-title3 font-semibold">
          Theme
        </h2>
        <Globals id={null} />
      </section>
      {[...groups].map(([title, entries]) => (
        <section key={title} aria-label={title}>
          <h2 className="text-title3 font-semibold">{title}</h2>
          <ul>
            {entries.map((story) => (
              <li key={story.id}>
                <a href={href(story.id, globals)} className="text-accent-text underline">
                  {story.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

function App() {
  if (!storyId) return <Index />;
  if (!Story) {
    return (
      <main className="p-6 text-body text-label">
        <h1 className="text-title2">No story with id “{storyId}”</h1>
        <a href="./" className="text-accent-text underline">
          All stories
        </a>
      </main>
    );
  }
  // `data-story` tells the tests the story has mounted. No chrome is added around it.
  return (
    <div data-story={storyId}>
      <Story />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
