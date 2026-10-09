import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Breadcrumb, Breadcrumbs, Link, Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider } from "./RouterProvider";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

/**
 * The wiring between React Aria and the Next.js router is INFERRED from the
 * prop types (ARCHITECTURE.md section 9), so it is tested here with the three
 * link-bearing primitives the plan names. `next/navigation` is mocked: this
 * proves React Aria calls `router.push` with the right arguments, not that the
 * real App Router then navigates.
 */
describe("RouterProvider", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("sends a Link click to router.push, with router options", async () => {
    const user = userEvent.setup();
    render(
      <RouterProvider>
        <Link href="/settings" routerOptions={{ scroll: false }}>
          Settings
        </Link>
      </RouterProvider>,
    );
    const link = screen.getByRole("link", { name: "Settings" });
    // Still a real link, so open-in-new-tab and no-JavaScript navigation work.
    expect(link).toHaveAttribute("href", "/settings");

    await user.click(link);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/settings", { scroll: false });
  });

  it("navigates from the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <RouterProvider>
        <Link href="/inbox">Inbox</Link>
      </RouterProvider>,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Inbox" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/inbox", undefined);
  });

  it("leaves modified clicks, new-tab links and external links to the browser", async () => {
    const user = userEvent.setup();
    render(
      <RouterProvider>
        <Link href="/a">Plain</Link>
        <Link href="/b" target="_blank">
          New tab
        </Link>
        <Link href="https://example.com/c">External</Link>
      </RouterProvider>,
    );
    // jsdom cannot open tabs or leave the page; only the router call matters here.
    for (const link of screen.getAllByRole("link")) {
      link.addEventListener("click", (event) => event.preventDefault());
    }

    await user.keyboard("{Meta>}");
    await user.click(screen.getByRole("link", { name: "Plain" }));
    await user.keyboard("{/Meta}");
    await user.click(screen.getByRole("link", { name: "New tab" }));
    await user.click(screen.getByRole("link", { name: "External" }));
    expect(push).not.toHaveBeenCalled();
  });

  it("sends a Tab with an href to router.push", async () => {
    const user = userEvent.setup();
    render(
      <RouterProvider>
        <Tabs selectedKey="/library">
          <TabList aria-label="Sections">
            <Tab id="/library" href="/library">
              Library
            </Tab>
            <Tab id="/store" href="/store">
              Store
            </Tab>
          </TabList>
          <TabPanel id="/library">Library</TabPanel>
          <TabPanel id="/store">Store</TabPanel>
        </Tabs>
      </RouterProvider>,
    );
    await user.click(screen.getByRole("tab", { name: "Store" }));
    expect(push).toHaveBeenCalledWith("/store", undefined);
  });

  it("sends a Breadcrumb link to router.push", async () => {
    const user = userEvent.setup();
    render(
      <RouterProvider>
        <Breadcrumbs>
          <Breadcrumb>
            <Link href="/">Home</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link href="/documents">Documents</Link>
          </Breadcrumb>
          <Breadcrumb>
            <Link>Report</Link>
          </Breadcrumb>
        </Breadcrumbs>
      </RouterProvider>,
    );
    await user.click(screen.getByRole("link", { name: "Documents" }));
    expect(push).toHaveBeenCalledWith("/documents", undefined);
  });
});
