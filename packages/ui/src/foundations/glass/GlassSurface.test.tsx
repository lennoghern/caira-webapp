import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "../../test/axe";
import { GlassFilterDefs } from "./GlassFilterDefs";
import { GlassGroup } from "./GlassGroup";
import { GlassReveal } from "./GlassReveal";
import { GlassSurface } from "./GlassSurface";
import { concentric, concentricContainerStyle } from "./concentric";
import { glassSurface } from "./glass.styles";
import {
  GLASS_REFRACTION_FILTER_ID,
  isSoftwareRendered,
  rendersBackdropSvgFilter,
  resetBackdropSvgFilterSupport,
  supportsBackdropSvgFilter,
} from "./refraction";

describe("GlassSurface", () => {
  it("renders regular, medium, rounded glass by default", () => {
    render(<GlassSurface data-testid="glass">Content</GlassSurface>);
    const glass = screen.getByTestId("glass");
    expect(glass.tagName).toBe("DIV");
    expect(glass).toHaveAttribute("data-glass", "regular");
    expect(glass).toHaveClass("glass-surface", "glass-regular", "glass-medium", "glass-shape-rounded");
    expect(glass).not.toHaveClass("glass-interactive", "glass-tinted", "glass-dim", "glass-bounce");
    expect(glass).toHaveTextContent("Content");
  });

  it.each([
    [{ variant: "clear" } as const, ["glass-clear"], ["glass-regular"]],
    [{ size: "small" } as const, ["glass-small"], ["glass-medium"]],
    [{ size: "large" } as const, ["glass-large"], ["glass-medium"]],
    [{ shape: "capsule" } as const, ["glass-shape-capsule"], ["glass-shape-rounded"]],
    [{ shape: "circle" } as const, ["glass-shape-circle"], ["glass-shape-rounded"]],
    [{ shape: "concentric" } as const, ["rounded-concentric"], ["glass-shape-rounded"]],
    [{ shape: "none" } as const, [], ["glass-shape-rounded", "rounded-concentric"]],
    [{ dim: true } as const, ["glass-dim"], []],
    [{ interactive: true } as const, ["glass-interactive"], ["glass-bounce"]],
    [{ interactive: true, bounce: true } as const, ["glass-interactive", "glass-bounce"], []],
  ])("maps %o to classes", (props, present, absent) => {
    render(<GlassSurface data-testid="glass" {...props} />);
    const glass = screen.getByTestId("glass");
    for (const name of present) expect(glass).toHaveClass(name);
    for (const name of absent) expect(glass).not.toHaveClass(name);
  });

  it("ignores bounce without interactive: the bounce is a response to a press", () => {
    render(<GlassSurface data-testid="glass" bounce />);
    expect(screen.getByTestId("glass")).not.toHaveClass("glass-bounce");
  });

  it("marks the variant for nested-glass detection", () => {
    render(
      <GlassSurface data-testid="outer">
        <GlassSurface data-testid="inner" variant="clear" />
      </GlassSurface>,
    );
    // The CSS rule `:where([data-glass]) .glass-surface` strips blur from the inner one.
    expect(screen.getByTestId("inner").closest("[data-glass='regular']")).toBe(screen.getByTestId("outer"));
    expect(screen.getByTestId("inner")).toHaveAttribute("data-glass", "clear");
  });

  it("tints with the accent or with any color", () => {
    const { rerender } = render(<GlassSurface data-testid="glass" tint="accent" />);
    const glass = screen.getByTestId("glass");
    expect(glass).toHaveClass("glass-tinted");
    expect(glass.style.getPropertyValue("--glass-tint")).toBe("var(--accent-fill)");

    rerender(<GlassSurface data-testid="glass" tint="rgb(255 45 85)" style={{ inlineSize: 40 }} />);
    expect(glass.style.getPropertyValue("--glass-tint")).toBe("rgb(255 45 85)");
    expect(glass.style.inlineSize).toBe("40px");
  });

  it("can be pinned to an appearance", () => {
    render(<GlassSurface data-testid="glass" appearance="dark" />);
    expect(screen.getByTestId("glass")).toHaveAttribute("data-appearance", "dark");
  });

  it("renders the element asked for and passes attributes through", () => {
    render(
      <GlassSurface as="nav" aria-label="Sections" id="bar" className="px-3 glass-large">
        <a href="#one">One</a>
      </GlassSurface>,
    );
    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav).toHaveAttribute("id", "bar");
    // A caller's class wins over the default of the same group.
    expect(nav).toHaveClass("px-3", "glass-large");
    expect(nav).not.toHaveClass("glass-medium");
  });

  it("takes ref as a plain prop (React 19)", () => {
    const plain = createRef<HTMLElement>();
    const section = createRef<HTMLElement>();
    render(
      <>
        <GlassSurface ref={plain} />
        <GlassSurface ref={section} as="section" expanded={false} />
      </>,
    );
    expect(plain.current).toBeInstanceOf(HTMLDivElement);
    expect(section.current?.tagName).toBe("SECTION");
  });

  it("is not expandable unless told so", () => {
    render(<GlassSurface data-testid="glass" />);
    const glass = screen.getByTestId("glass");
    expect(glass).not.toHaveAttribute("data-expanded");
    expect(glass).not.toHaveClass("glass-expandable");
  });

  it("animates its own radius when expandable, in place of a fixed shape", () => {
    const { rerender } = render(<GlassSurface data-testid="glass" expanded={false} shape="capsule" />);
    const glass = screen.getByTestId("glass");
    expect(glass).toHaveClass("glass-expandable");
    expect(glass).toHaveAttribute("data-expanded", "false");
    // A fixed shape would fight the animated radius.
    expect(glass).not.toHaveClass("glass-shape-capsule", "glass-shape-rounded");

    rerender(<GlassSurface data-testid="glass" expanded shape="capsule" />);
    // The same element, in its other state.
    expect(screen.getByTestId("glass")).toBe(glass);
    expect(glass).toHaveAttribute("data-expanded", "true");
  });

  it("adds no role, name or tab stop of its own", () => {
    render(<GlassSurface data-testid="glass" interactive />);
    const glass = screen.getByTestId("glass");
    expect(glass).not.toHaveAttribute("role");
    expect(glass).not.toHaveAttribute("tabindex");
  });

  it("has no axe violations as a bar, a tinted control wrapper and clear glass", async () => {
    const { container } = render(
      <>
        <GlassSurface as="nav" aria-label="Sections" shape="capsule">
          <a href="#one">One</a>
        </GlassSurface>
        <GlassSurface tint="accent" size="small" interactive bounce>
          <button type="button">Done</button>
        </GlassSurface>
        <GlassSurface variant="clear" dim>
          <p>Caption over a photo</p>
        </GlassSurface>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("glassSurface()", () => {
  it("gives controls the same classes without the wrapper element", () => {
    expect(glassSurface({ size: "small", shape: "capsule", interactive: true })).toBe(
      "glass-surface glass-regular glass-small glass-shape-capsule glass-interactive",
    );
  });
});

describe("GlassGroup", () => {
  it("lays out its surfaces with the given spacing", () => {
    render(
      <GlassGroup spacing={12} data-testid="group" className="justify-end">
        <GlassSurface />
        <GlassSurface />
      </GlassGroup>,
    );
    const group = screen.getByTestId("group");
    expect(group).toHaveAttribute("data-glass-group");
    expect(group).toHaveClass("flex", "justify-end");
    expect(group.style.gap).toBe("12px");
  });
});

describe("an expanding surface: GlassSurface expanded with GlassReveal", () => {
  function Pill({ axis }: { axis?: "block" | "both" }) {
    const [expanded, setExpanded] = useState(false);
    return (
      <GlassSurface expanded={expanded} data-testid="pill">
        <button type="button" aria-expanded={expanded} aria-controls="details" onClick={() => setExpanded((value) => !value)}>
          Now playing
        </button>
        <GlassReveal id="details" expanded={expanded} axis={axis} className="w-64 pt-2" data-testid="reveal">
          <p>Track 3 of 12</p>
          <a href="#queue">Open the queue</a>
        </GlassReveal>
      </GlassSurface>
    );
  }

  it("renders the reveal as a grid, a clipping child, and the content", () => {
    render(<Pill />);
    const reveal = screen.getByTestId("reveal");
    expect(reveal).toHaveClass("glass-reveal");
    expect(reveal).toHaveAttribute("id", "details");
    expect(reveal).toHaveAttribute("data-expanded", "false");
    expect(reveal).toHaveAttribute("data-axis", "block");
    // The clipping child carries no class: padding there could not collapse to nothing.
    const clip = reveal.firstElementChild!;
    expect(reveal.children).toHaveLength(1);
    expect(clip).not.toHaveAttribute("class");
    expect(clip.firstElementChild).toHaveClass("w-64", "pt-2");
    expect(clip.firstElementChild).toHaveTextContent("Track 3 of 12");
  });

  it("can animate the width as well", () => {
    render(<Pill axis="both" />);
    expect(screen.getByTestId("reveal")).toHaveAttribute("data-axis", "both");
  });

  it("toggles the same elements between two states and keeps focus on the control", async () => {
    const user = userEvent.setup();
    render(<Pill />);
    const pill = screen.getByTestId("pill");
    const reveal = screen.getByTestId("reveal");
    const button = screen.getByRole("button", { name: "Now playing" });
    // The content is always in the document; CSS hides it while collapsed.
    expect(screen.getByText("Track 3 of 12")).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByTestId("pill")).toBe(pill);
    expect(screen.getByTestId("reveal")).toBe(reveal);
    expect(pill).toHaveAttribute("data-expanded", "true");
    expect(reveal).toHaveAttribute("data-expanded", "true");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(pill).toHaveAttribute("data-expanded", "false");
    expect(reveal).toHaveAttribute("data-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("has no axe violations in either state", async () => {
    const user = userEvent.setup();
    const { container } = render(<Pill />);
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Now playing" }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("concentric", () => {
  it("subtracts the padding from the outer radius", () => {
    expect(concentric(16, 6)).toBe(10);
    expect(concentric(24, 8)).toBe(16);
  });

  it("never goes below the floor, and ignores negative padding", () => {
    expect(concentric(8, 12)).toBe(4);
    expect(concentric(8, 12, 0)).toBe(0);
    expect(concentric(16, -4)).toBe(16);
    expect(concentric(Number.NaN, 4)).toBe(4);
  });

  it("publishes radius and padding for `rounded-concentric` children", () => {
    expect(concentricContainerStyle(20, 6)).toEqual({
      borderRadius: 20,
      padding: 6,
      "--concentric-radius": "20px",
      "--concentric-padding": "6px",
    });
  });
});

describe("GlassFilterDefs", () => {
  it("renders one hidden filter with the id the stylesheet references", () => {
    const { container } = render(<GlassFilterDefs />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(container.querySelectorAll("filter")).toHaveLength(1);
    expect(container.querySelector("filter")).toHaveAttribute("id", GLASS_REFRACTION_FILTER_ID);
    expect(container.querySelector("feDisplacementMap")).not.toBeNull();
    expect(container.querySelector("feSpecularLighting")).not.toBeNull();
  });
});

describe("supportsBackdropSvgFilter", () => {
  const CHROMIUM = ["Not_A Brand", "Chromium", "Google Chrome"];
  const GPU = "ANGLE (AMD, AMD Radeon(TM) RX Vega 11 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)";
  const SWIFTSHADER = "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)";

  const stubEngine = (parses: boolean, brands: string[] | undefined, renderer: string | null = GPU) => {
    resetBackdropSvgFilterSupport();
    vi.stubGlobal("CSS", { supports: vi.fn(() => parses) });
    vi.stubGlobal("navigator", brands ? { userAgentData: { brands: brands.map((brand) => ({ brand })) } } : {});
    const gl = {
      getExtension: (name: string) => (name === "WEBGL_debug_renderer_info" ? { UNMASKED_RENDERER_WEBGL: 1 } : null),
      getParameter: () => renderer,
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => (renderer === null ? null : gl) as unknown as RenderingContext,
    );
  };

  it("is false in an environment without CSS.supports", () => {
    resetBackdropSvgFilterSupport();
    expect(rendersBackdropSvgFilter()).toBe(false);
    expect(supportsBackdropSvgFilter()).toBe(false);
  });

  it("separates what the engine renders from what is worth turning on", () => {
    stubEngine(true, CHROMIUM, SWIFTSHADER);
    // Chromium renders it even in software; it is just too slow to be the default.
    expect(rendersBackdropSvgFilter()).toBe(true);
    expect(supportsBackdropSvgFilter()).toBe(false);
  });

  it("is true when the value parses, the engine reports Chromium and a GPU renders", () => {
    stubEngine(true, CHROMIUM);
    expect(supportsBackdropSvgFilter()).toBe(true);
  });

  it("is false for engines that parse the value but do not render it", () => {
    // Firefox and Safari: no userAgentData.
    stubEngine(true, undefined);
    expect(supportsBackdropSvgFilter()).toBe(false);
  });

  it("is false when the value does not parse", () => {
    stubEngine(false, CHROMIUM);
    expect(supportsBackdropSvgFilter()).toBe(false);
  });

  it("is false under software rendering, where the filter is too slow", () => {
    stubEngine(true, CHROMIUM, SWIFTSHADER);
    expect(isSoftwareRendered()).toBe(true);
    expect(supportsBackdropSvgFilter()).toBe(false);
  });

  it("treats a missing WebGL context as software rendering", () => {
    stubEngine(true, CHROMIUM, null);
    expect(supportsBackdropSvgFilter()).toBe(false);
  });

  it("computes the answer once per page", () => {
    stubEngine(true, CHROMIUM);
    expect(supportsBackdropSvgFilter()).toBe(true);
    vi.stubGlobal("navigator", {});
    expect(supportsBackdropSvgFilter()).toBe(true);
  });
});
