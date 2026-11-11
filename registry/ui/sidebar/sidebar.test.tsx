import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";

// jsdom has no matchMedia, and useIsMobile reads window.innerWidth against it (as in
// registry/hooks/use-mobile.test.ts): a viewport stub that fires `change` like a browser does.
function stubViewport(width: number) {
  const listeners = new Set<() => void>();
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    get matches() {
      return window.innerWidth < 768;
    },
    addEventListener: (type: string, listener: () => void) => {
      if (type === "change") listeners.add(listener);
    },
    removeEventListener: (type: string, listener: () => void) => {
      if (type === "change") listeners.delete(listener);
    },
  }));
  return {
    resize(to: number) {
      vi.stubGlobal("innerWidth", to);
      act(() => {
        for (const listener of listeners) listener();
      });
    },
  };
}

beforeEach(() => {
  stubViewport(1280);
  // biome-ignore lint/suspicious/noDocumentCookie: clears the cookie stock writes, between tests.
  document.cookie = "sidebar_state=; path=/; max-age=0";
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function State() {
  const { state, open, openMobile, isMobile } = useSidebar();
  return (
    <output data-testid="state">{`${state} ${open} ${openMobile} ${isMobile ? "phone" : "desk"}`}</output>
  );
}

function Shell({
  provider,
  sidebar,
}: {
  provider?: Omit<React.ComponentProps<typeof SidebarProvider>, "children">;
  sidebar?: React.ComponentProps<typeof Sidebar>;
}) {
  return (
    <SidebarProvider {...provider}>
      <Sidebar {...sidebar}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Library</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>Home</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <div>
        <SidebarTrigger />
        <State />
      </div>
    </SidebarProvider>
  );
}

const state = () => screen.getByTestId("state").textContent;
const triggerButton = () =>
  document.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]') as HTMLElement;
const sidebarRoot = () => document.querySelector<HTMLElement>('[data-slot="sidebar"]');

describe("Sidebar", () => {
  it("keeps stock's slots and data attributes on the desktop rail", () => {
    render(<Shell />);
    const root = sidebarRoot();
    expect(root?.dataset.state).toBe("expanded");
    expect(root?.dataset.variant).toBe("sidebar");
    expect(root?.dataset.side).toBe("left");
    for (const slot of ["sidebar-wrapper", "sidebar-gap", "sidebar-container", "sidebar-inner"]) {
      expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
    const trigger = triggerButton();
    expect(trigger.dataset.slot).toBe("sidebar-trigger");
    expect(state()).toBe("expanded true false desk");
  });

  it("collapses and expands by its trigger", () => {
    render(<Shell />);
    const trigger = triggerButton();
    fireEvent.click(trigger);
    expect(sidebarRoot()?.dataset.state).toBe("collapsed");
    expect(sidebarRoot()?.dataset.collapsible).toBe("offcanvas");
    fireEvent.click(trigger);
    expect(sidebarRoot()?.dataset.state).toBe("expanded");
    expect(sidebarRoot()?.dataset.collapsible).toBe("");
  });

  it("collapses by Ctrl+B and Cmd+B, and ignores a plain b", () => {
    render(<Shell sidebar={{ collapsible: "icon" }} />);
    fireEvent.keyDown(window, { key: "b" });
    expect(state()).toBe("expanded true false desk");
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(sidebarRoot()?.dataset.state).toBe("collapsed");
    expect(sidebarRoot()?.dataset.collapsible).toBe("icon");
    fireEvent.keyDown(window, { key: "b", metaKey: true });
    expect(sidebarRoot()?.dataset.state).toBe("expanded");
  });

  it("keeps stock's state: the sidebar_state cookie, defaultOpen and a controlled open", () => {
    const { unmount } = render(<Shell provider={{ defaultOpen: false }} />);
    expect(state()).toBe("collapsed false false desk");
    fireEvent.click(triggerButton());
    expect(document.cookie).toContain("sidebar_state=true");
    fireEvent.click(triggerButton());
    expect(document.cookie).toContain("sidebar_state=false");
    unmount();

    const onOpenChange = vi.fn();
    render(<Shell provider={{ open: true, onOpenChange }} />);
    fireEvent.click(triggerButton());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Controlled: nothing changes until the owner passes the new value.
    expect(state()).toBe("expanded true false desk");
  });

  it("is mangacn's sheet on a phone, opened by the trigger and the shortcut", async () => {
    stubViewport(375);
    render(<Shell />);
    await act(async () => {});
    expect(state()).toBe("expanded true false phone");
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(triggerButton());
    await act(async () => {});
    const sheet = screen.getByRole("dialog");
    expect(sheet.dataset.slot).toBe("sidebar");
    expect(sheet.dataset.mobile).toBe("true");
    expect(sheet.dataset.side).toBe("left");
    // mangacn's sheet: one heavy hand-drawn edge, an ink overlay.
    expect(
      sheet.querySelector(':scope > [data-slot="ink-frame"]')?.getAttribute("data-shape"),
    ).toBe("line");
    expect(document.querySelector('[data-slot="sheet-overlay"]')?.className).toContain("bg-ink/70");
    expect(screen.getByText("Library")).toBeTruthy();
    // The desktop state is untouched: the shortcut toggles the sheet on a phone.
    expect(state()).toBe("expanded true true phone");
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    await act(async () => {});
    expect(state()).toBe("expanded true false phone");
  });

  it("swaps the rail for the sheet when the viewport crosses the breakpoint", async () => {
    const viewport = stubViewport(1024);
    render(<Shell />);
    expect(document.querySelector('[data-slot="sidebar-container"]')).not.toBeNull();
    viewport.resize(500);
    await act(async () => {});
    expect(document.querySelector('[data-slot="sidebar-container"]')).toBeNull();
    expect(state()).toBe("expanded true false phone");
  });

  it("draws one hand-drawn rule on the inner edge instead of a border", () => {
    render(<Shell />);
    const container = document.querySelector('[data-slot="sidebar-container"]');
    expect(container?.className).not.toMatch(/(^|\s|:)border-[lr](\s|$)/);
    const frames = container?.querySelectorAll(':scope > [data-slot="ink-frame"]');
    expect(frames).toHaveLength(1);
    expect(frames?.[0].getAttribute("data-shape")).toBe("line");
    expect(frames?.[0].className).toContain("group-data-[side=left]:right-0");
  });

  it("makes SidebarRail a hand-drawn rule, heavy under the pointer", () => {
    render(<Shell />);
    const rail = document.querySelector('[data-slot="sidebar-rail"]');
    expect(rail?.getAttribute("aria-label")).toBe("Toggle Sidebar");
    const rule = rail?.querySelector('[data-slot="ink-frame"]');
    expect(rule?.getAttribute("data-shape")).toBe("line");
    expect(rule?.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    expect(rule?.className).toContain("group-hover/sidebar-rail:opacity-100");
    fireEvent.click(rail as Element);
    expect(sidebarRoot()?.dataset.state).toBe("collapsed");
  });

  it("throws outside a provider, like stock", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<SidebarTrigger />)).toThrow(
      "useSidebar must be used within a SidebarProvider.",
    );
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"), { setup: () => stubViewport(1280) });
});
