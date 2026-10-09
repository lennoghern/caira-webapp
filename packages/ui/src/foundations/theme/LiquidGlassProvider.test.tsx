import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { GlassSurface } from "../glass/GlassSurface";
import { GLASS_REFRACTION_FILTER_ID } from "../glass/refraction";
import { LiquidGlassProvider, type LiquidGlassProviderProps } from "./LiquidGlassProvider";
import { useLiquidGlass } from "./context";
import { DEFAULT_PREFERENCES, DEFAULT_STORAGE_KEY, type LiquidGlassPreferences } from "./types";

const root = document.documentElement;

function Probe() {
  const { preferences, resolved, layout, refraction, setPreferences, resetPreferences } = useLiquidGlass();
  return (
    <div>
      <output data-testid="state">{JSON.stringify({ preferences, resolved, layout, refraction })}</output>
      <button onClick={() => setPreferences({ appearance: "dark" })}>Dark</button>
      <button onClick={() => setPreferences({ clarity: 4 })}>Too clear</button>
      <button
        onClick={() => {
          setPreferences({ contrast: "more" });
          setPreferences({ motion: "reduced" });
        }}
      >
        Two changes
      </button>
      <button onClick={() => setPreferences({ accent: "rgb(255 45 85)", platform: "ios", transparency: "reduced" })}>
        Many
      </button>
      <button onClick={resetPreferences}>Reset</button>
    </div>
  );
}

function state(): {
  preferences: LiquidGlassPreferences;
  resolved: Record<string, unknown>;
  layout: Record<string, string>;
  refraction: boolean;
} {
  return JSON.parse(screen.getByTestId("state").textContent ?? "{}");
}

function stored(): Record<string, unknown> | null {
  const raw = window.localStorage.getItem(DEFAULT_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

function renderProvider(props: Omit<LiquidGlassProviderProps, "children"> = {}) {
  return render(
    <LiquidGlassProvider {...props}>
      <Probe />
    </LiquidGlassProvider>,
  );
}

function mockMatchMedia(matching: string[]) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: matching.includes(query),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe("LiquidGlassProvider", () => {
  it("writes the default theme on <html> and removes it on unmount", () => {
    const { unmount } = renderProvider();
    expect(root).not.toHaveAttribute("data-appearance");
    expect(root).toHaveAttribute("data-platform", "macos");
    expect(root.style.getPropertyValue("--glass-clarity")).toBe("0.5");
    expect(root.style.getPropertyValue("--accent-custom")).toBe("");
    expect(state().preferences).toEqual(DEFAULT_PREFERENCES);

    unmount();
    expect(root).not.toHaveAttribute("data-platform");
    expect(root.style.getPropertyValue("--glass-clarity")).toBe("");
  });

  it("mirrors the macOS 27 layout options as attributes, defaulting to the macOS 27 behavior", () => {
    const { rerender } = renderProvider();
    expect(root).toHaveAttribute("data-toolbar-style", "uniform");
    expect(root).toHaveAttribute("data-sidebar-style", "edge-to-edge");
    expect(root).toHaveAttribute("data-window-corners", "uniform");
    expect(root).toHaveAttribute("data-active-window-emphasis", "strong");
    expect(root).toHaveAttribute("data-menu-icons", "selective");

    rerender(
      <LiquidGlassProvider layout={{ sidebarStyle: "floating", toolbarStyle: "floating", menuIcons: "all" }}>
        <Probe />
      </LiquidGlassProvider>,
    );
    expect(root).toHaveAttribute("data-toolbar-style", "floating");
    expect(root).toHaveAttribute("data-sidebar-style", "floating");
    expect(root).toHaveAttribute("data-menu-icons", "all");
    expect(state().layout.sidebarStyle).toBe("floating");
  });

  it("applies what was stored", () => {
    window.localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ v: 1, appearance: "dark", clarity: 0.9 }));
    renderProvider();
    expect(root).toHaveAttribute("data-appearance", "dark");
    expect(root.style.getPropertyValue("--glass-clarity")).toBe("0.9");
    expect(state().preferences).toMatchObject({ appearance: "dark", clarity: 0.9, platform: "macos" });
  });

  it("changes the theme and persists it", async () => {
    const user = userEvent.setup();
    const onPreferencesChange = vi.fn();
    renderProvider({ onPreferencesChange });

    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(root).toHaveAttribute("data-appearance", "dark");
    expect(stored()).toMatchObject({ v: 1, appearance: "dark" });
    expect(onPreferencesChange).toHaveBeenLastCalledWith({ ...DEFAULT_PREFERENCES, appearance: "dark" });

    await user.click(screen.getByRole("button", { name: "Many" }));
    expect(root).toHaveAttribute("data-platform", "ios");
    expect(root).toHaveAttribute("data-transparency", "reduced");
    expect(root.style.getPropertyValue("--accent-custom")).toBe("rgb(255 45 85)");
  });

  it("clamps clarity", async () => {
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByRole("button", { name: "Too clear" }));
    expect(state().preferences.clarity).toBe(1);
    expect(root.style.getPropertyValue("--glass-clarity")).toBe("1");
  });

  it("keeps both changes when the theme is set twice in one event", async () => {
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByRole("button", { name: "Two changes" }));
    expect(root).toHaveAttribute("data-contrast", "more");
    expect(root).toHaveAttribute("data-motion", "reduced");
  });

  it("resets to the defaults and clears storage", async () => {
    const user = userEvent.setup();
    renderProvider({ defaultPreferences: { clarity: 0.3 } });
    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(stored()).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(stored()).toBeNull();
    expect(root).not.toHaveAttribute("data-appearance");
    expect(state().preferences).toEqual({ ...DEFAULT_PREFERENCES, clarity: 0.3 });
  });

  it("follows another tab through the storage event", () => {
    renderProvider();
    act(() => {
      window.localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ appearance: "dark" }));
      window.dispatchEvent(new StorageEvent("storage", { key: DEFAULT_STORAGE_KEY }));
    });
    expect(root).toHaveAttribute("data-appearance", "dark");
  });

  it("does not touch storage when persistence is off", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ appearance: "dark" }));
    renderProvider({ storageKey: null });
    expect(root).not.toHaveAttribute("data-appearance");

    await user.click(screen.getByRole("button", { name: "Many" }));
    expect(root).toHaveAttribute("data-platform", "ios");
    expect(stored()).toEqual({ appearance: "dark" });
  });

  it("keeps working when localStorage throws", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    renderProvider();
    expect(state().preferences).toEqual(DEFAULT_PREFERENCES);

    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(root).toHaveAttribute("data-appearance", "dark");
  });

  it("can be controlled, and then neither reads nor writes storage", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ appearance: "dark" }));
    const onPreferencesChange = vi.fn();
    const { rerender } = renderProvider({ preferences: { appearance: "light", clarity: 0.1 }, onPreferencesChange });
    expect(root).toHaveAttribute("data-appearance", "light");
    expect(root.style.getPropertyValue("--glass-clarity")).toBe("0.1");

    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(onPreferencesChange).toHaveBeenCalledWith({ ...DEFAULT_PREFERENCES, appearance: "dark", clarity: 0.1 });
    // The owner has not changed the prop yet.
    expect(root).toHaveAttribute("data-appearance", "light");
    expect(stored()).toEqual({ appearance: "dark" });

    rerender(
      <LiquidGlassProvider preferences={{ appearance: "dark", clarity: 0.1 }} onPreferencesChange={onPreferencesChange}>
        <Probe />
      </LiquidGlassProvider>,
    );
    expect(root).toHaveAttribute("data-appearance", "dark");
  });

  it("puts the theme back after the Strict Mode remount", () => {
    window.localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ appearance: "dark" }));
    render(
      <StrictMode>
        <LiquidGlassProvider>
          <Probe />
        </LiquidGlassProvider>
      </StrictMode>,
    );
    expect(root).toHaveAttribute("data-appearance", "dark");
    expect(root).toHaveAttribute("data-platform", "macos");
  });

  it("resolves the system settings for behavior", () => {
    mockMatchMedia(["(prefers-color-scheme: dark)", "(prefers-reduced-motion: reduce)"]);
    renderProvider();
    expect(state().resolved).toEqual({
      appearance: "dark",
      reducedTransparency: false,
      increasedContrast: false,
      reducedMotion: true,
      forcedColors: false,
    });
  });

  it("lets an explicit preference win over the system setting", () => {
    mockMatchMedia(["(prefers-color-scheme: dark)"]);
    renderProvider({ preferences: { appearance: "light", transparency: "reduced", contrast: "more" } });
    expect(state().resolved).toMatchObject({ appearance: "light", reducedTransparency: true, increasedContrast: true });
  });

  describe("refraction (rendering tier 2)", () => {
    it("mounts the shared SVG filter once", () => {
      const { container } = renderProvider();
      expect(container.querySelectorAll(`filter#${GLASS_REFRACTION_FILTER_ID}`)).toHaveLength(1);
      expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });

    it("can leave the filter out", () => {
      const { container } = renderProvider({ filterDefs: false });
      expect(container.querySelector("filter")).toBeNull();
    });

    it("stays off where the browser is not known to render it", () => {
      // jsdom: no CSS.supports, no userAgentData.
      renderProvider();
      expect(root).not.toHaveAttribute("data-glass-refraction");
      expect(state().refraction).toBe(false);
    });

    it("cannot be forced on outside Chromium, where it would switch the whole backdrop filter off", () => {
      vi.stubGlobal("CSS", { supports: () => true });
      renderProvider({ refraction: "on" });
      expect(root).not.toHaveAttribute("data-glass-refraction");
      expect(state().refraction).toBe(false);
    });

    it("can be forced on and off in Chromium", () => {
      vi.stubGlobal("CSS", { supports: () => true });
      vi.stubGlobal("navigator", { userAgentData: { brands: [{ brand: "Chromium" }] } });
      const { rerender } = renderProvider({ refraction: "on" });
      expect(root).toHaveAttribute("data-glass-refraction", "on");
      expect(state().refraction).toBe(true);

      rerender(
        <LiquidGlassProvider refraction="off">
          <Probe />
        </LiquidGlassProvider>,
      );
      expect(root).not.toHaveAttribute("data-glass-refraction");
    });
  });

  describe("glass budget (development only)", () => {
    it("warns once when more blurred surfaces are mounted than the budget", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <LiquidGlassProvider glassBudget={2}>
          <GlassSurface />
          <GlassSurface />
          <GlassSurface>
            {/* Nested glass renders a tint only and does not count. */}
            <GlassSurface />
          </GlassSurface>
        </LiquidGlassProvider>,
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toMatch(/3 blurred glass surfaces/);
    });

    it("stays quiet within the budget or when disabled", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      // The count is document-wide, so each case gets the document to itself.
      const disabled = render(
        <LiquidGlassProvider glassBudget={false}>
          <GlassSurface />
          <GlassSurface />
          <GlassSurface />
        </LiquidGlassProvider>,
      );
      disabled.unmount();
      render(
        <LiquidGlassProvider glassBudget={2}>
          <GlassSurface />
          <GlassSurface />
        </LiquidGlassProvider>,
      );
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("hydration", () => {
    it("hydrates server markup without a mismatch when storage differs from the defaults", async () => {
      const app = (
        <LiquidGlassProvider>
          <Probe />
        </LiquidGlassProvider>
      );
      const container = document.createElement("div");
      document.body.append(container);
      // renderToString always uses the server snapshot: the defaults.
      container.innerHTML = renderToString(app);
      expect(container.textContent).toContain('"appearance":"system"');

      window.localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ appearance: "dark", clarity: 0.8 }));
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const onRecoverableError = vi.fn();
      const hydrated = await act(async () => hydrateRoot(container, app, { onRecoverableError }));

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(root).toHaveAttribute("data-appearance", "dark");
      expect(container.textContent).toContain('"appearance":"dark"');

      act(() => hydrated.unmount());
      container.remove();
    });
  });
});

describe("useLiquidGlass without a provider", () => {
  it("returns the defaults and ignores changes, with a warning", async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Probe />);
    expect(state().preferences).toEqual(DEFAULT_PREFERENCES);

    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(state().preferences).toEqual(DEFAULT_PREFERENCES);
    expect(root).not.toHaveAttribute("data-appearance");
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
