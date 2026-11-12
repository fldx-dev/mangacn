import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
} from "./message-scroller";

beforeAll(() => {
  stubResizeObserver();
});

afterEach(cleanup);

function Thread({ lines = 3, children }: { lines?: number; children?: React.ReactNode }) {
  return (
    <MessageScrollerProvider>
      <MessageScroller className="custom-class">
        <MessageScrollerViewport aria-label="Notes">
          <MessageScrollerContent>
            {Array.from({ length: lines }, (_, index) => (
              <MessageScrollerItem
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed rows
                key={index}
                messageId={`m${index}`}
              >
                Line {index + 1}
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
        {children}
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

function Probe({ seen }: { seen: { commands?: ReturnType<typeof useMessageScroller> } }) {
  seen.commands = useMessageScroller();
  return null;
}

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe("MessageScroller", () => {
  it("keeps stock's slots, roles and className", () => {
    render(<Thread />);
    expect(slot("message-scroller")?.classList.contains("custom-class")).toBe(true);
    const viewport = screen.getByRole("region", { name: "Notes" });
    expect(viewport.dataset.slot).toBe("message-scroller-viewport");
    expect(viewport.tabIndex).toBe(0);
    expect(screen.getByRole("log").dataset.slot).toBe("message-scroller-content");
    expect(document.querySelectorAll('[data-slot="message-scroller-item"]')).toHaveLength(3);
    expect(slot("message-scroller-item")?.dataset.messageId).toBe("m0");
  });

  it("draws nothing on the viewport and gives it a thin ink scrollbar", () => {
    render(<Thread />);
    const viewport = slot("message-scroller-viewport");
    expect(viewport?.querySelector(':scope > [data-slot="ink-frame"]')).toBeNull();
    expect(viewport?.className).toContain("[scrollbar-color:var(--ink)_transparent]");
    expect(viewport?.className).toContain("[scrollbar-width:thin]");
  });

  it("renders the jump button as mangacn's outlined icon button, hidden while at the end", () => {
    render(<Thread />);
    const button = slot("message-scroller-button");
    expect(button?.tagName).toBe("BUTTON");
    expect(button?.dataset.variant).toBe("outline");
    expect(button?.dataset.size).toBe("icon-sm");
    expect(button?.dataset.direction).toBe("end");
    expect(button?.dataset.active).toBe("false");
    expect(button?.hasAttribute("inert")).toBe(true);
    expect(button?.textContent).toContain("Scroll to end");
    const frame = button?.querySelector<HTMLElement>(':scope > [data-slot="ink-frame"]');
    expect(frame?.dataset.fill).toBe("paper");
    // Centred without a translate, so the button's press nudge cannot move it off centre.
    expect(button?.className).toMatch(/(^| )inset-x-0( |$)/);
    expect(button?.className).not.toMatch(/-translate-x-1\/2/);
  });

  it("names the start button and turns its arrow", () => {
    render(
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent />
          </MessageScrollerViewport>
          <MessageScrollerButton direction="start" />
        </MessageScroller>
      </MessageScrollerProvider>,
    );
    const button = slot("message-scroller-button");
    expect(button?.dataset.direction).toBe("start");
    expect(button?.textContent).toContain("Scroll to start");
    expect(button?.className).toContain("data-[direction=start]:[&_svg]:rotate-180");
  });

  it("shows the jump button once the thread is scrolled up from the end", async () => {
    render(<Thread lines={20} />);
    const viewport = slot("message-scroller-viewport") as HTMLElement;
    const content = slot("message-scroller-content") as HTMLElement;
    // A 200 px viewport over 20 rows of 50 px, scrolled to the top.
    Object.defineProperty(viewport, "clientHeight", { configurable: true, value: 200 });
    Object.defineProperty(viewport, "scrollHeight", { configurable: true, value: 1000 });
    viewport.getBoundingClientRect = () => ({ top: 0, bottom: 200, height: 200 }) as DOMRect;
    for (const [index, row] of Array.from(content.children).entries()) {
      (row as HTMLElement).getBoundingClientRect = () =>
        ({ top: index * 50, bottom: index * 50 + 50, height: 50 }) as DOMRect;
    }
    viewport.scrollTop = 0;
    await act(async () => {
      fireEvent.scroll(viewport);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    const button = slot("message-scroller-button");
    expect(button?.dataset.active).toBe("true");
    expect(button?.hasAttribute("inert")).toBe(false);
  });

  it("exposes stock's scroll commands through useMessageScroller", () => {
    const seen: { commands?: ReturnType<typeof useMessageScroller> } = {};
    render(
      <Thread>
        <Probe seen={seen} />
      </Thread>,
    );
    const { commands } = seen;
    expect(typeof commands?.scrollToEnd).toBe("function");
    expect(typeof commands?.scrollToStart).toBe("function");
    expect(typeof commands?.scrollToMessage).toBe("function");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
