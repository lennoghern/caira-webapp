// @vitest-environment node

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Box } from "./index";

/**
 * Renders the server-safe layout components with no DOM at all, the way a
 * server does. This proves that nothing touches `window` or `document` while
 * rendering. It does not prove React Server Component compatibility: Vitest has
 * no RSC runtime. That is checked by building the Next.js app (PROGRESS.md).
 */
describe("server rendering", () => {
  it("renders every server-safe layout component without a browser and without console errors", () => {
    expect(typeof window).toBe("undefined");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const html = renderToString(
      <Box title="Sound">
        <Box title="Alerts">Inner</Box>
      </Box>,
    );

    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(html.match(/role="group"/g)).toHaveLength(2);
    // The title id and the reference to it are both in the HTML the server sends.
    const [, id] = /aria-labelledby="([^"]+)"/.exec(html) ?? [];
    expect(id).toBeTruthy();
    expect(html).toContain(`id="${id}"`);
  });
});
