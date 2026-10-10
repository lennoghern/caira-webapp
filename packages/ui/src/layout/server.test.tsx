// @vitest-environment node

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Icon } from "../foundations/icon/Icon";
// Each from its own file, as a Server Component bundle would resolve them: the
// category barrel also re-exports the Client Components of this category.
import { Box } from "./box";
import { Label } from "./label";

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
        <Label icon={<Icon name="info" />} level="secondary" lineLimit={1}>
          Applies to this device
        </Label>
        <Label as="label" htmlFor="volume">
          Volume
        </Label>
      </Box>,
    );

    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(html.match(/role="group"/g)).toHaveLength(2);
    // The title id and the reference to it are both in the HTML the server sends.
    const [, id] = /aria-labelledby="([^"]+)"/.exec(html) ?? [];
    expect(id).toBeTruthy();
    expect(html).toContain(`id="${id}"`);

    expect(html.match(/data-label=""/g)).toHaveLength(2);
    expect(html).toContain("Applies to this device");
    expect(html).toMatch(/<label[^>]*for="volume"/);
  });

  it("keeps the directive on every file that needs it, and off the ones that must not have it", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const here = dirname(fileURLToPath(import.meta.url));
    const components = readdirSync(here, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((folder) =>
        readdirSync(join(here, folder.name))
          .filter((file) => /^[A-Z]\w*\.tsx$/.test(file) && !/\.(test|stories)\.tsx$/.test(file))
          .map((file) => join(folder.name, file)),
      );
    const directive = (file: string) => readFileSync(join(here, file), "utf8").trimStart().startsWith('"use client"');
    const serverSafe = components.filter((file) => !directive(file)).map((file) => file.replace(/\\/g, "/"));
    // A component that imports React Aria without the directive fails the app build; one that carries it
    // needlessly ships JavaScript for nothing. This list is the contract the barrel's comment states.
    expect(serverSafe.sort()).toEqual(["box/Box.tsx", "label/Label.tsx"]);
    for (const file of components.filter(directive)) {
      expect(readFileSync(join(here, file), "utf8"), file).toMatch(/from "react-aria-components"|use(State|Id|Ref)\b/);
    }
  });
});
