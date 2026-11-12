import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "./bubble";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const framesOf = (element: Element | null) => [
  ...(element?.querySelectorAll<HTMLElement>(':scope > [data-slot="ink-frame"]') ?? []),
];
const contentOf = (text: string) =>
  screen.getByText(text).closest<HTMLElement>('[data-slot="bubble-content"]') as HTMLElement;

describe("Bubble", () => {
  it("renders stock slots and attributes with a forwarded className", () => {
    render(
      <BubbleGroup data-testid="group" className="group-class">
        <Bubble data-testid="bubble" className="custom-class">
          <BubbleContent className="content-class">Hello</BubbleContent>
          <BubbleReactions data-testid="reactions">2</BubbleReactions>
        </Bubble>
      </BubbleGroup>,
    );
    const bubble = screen.getByTestId("bubble");
    expect(screen.getByTestId("group").getAttribute("data-slot")).toBe("bubble-group");
    expect(screen.getByTestId("group").classList.contains("group-class")).toBe(true);
    expect(bubble.getAttribute("data-slot")).toBe("bubble");
    expect(bubble.getAttribute("data-variant")).toBe("default");
    expect(bubble.getAttribute("data-align")).toBe("start");
    expect(bubble.classList.contains("custom-class")).toBe(true);
    expect(contentOf("Hello").classList.contains("content-class")).toBe(true);
    const reactions = screen.getByTestId("reactions");
    expect(reactions.getAttribute("data-slot")).toBe("bubble-reactions");
    expect(reactions.getAttribute("data-side")).toBe("bottom");
    expect(reactions.getAttribute("data-align")).toBe("end");
    expect(reactions.classList.contains("translate-y-3/4")).toBe(true);
  });

  it("draws each variant's fill, ink for the sender and none for ghost", () => {
    const fills = {
      default: "ink",
      secondary: "paper",
      muted: "tone",
      tinted: "none",
      outline: "paper",
      destructive: "paper",
    } as const;
    for (const [variant, fill] of Object.entries(fills)) {
      render(
        <Bubble variant={variant as keyof typeof fills}>
          <BubbleContent>{variant}</BubbleContent>
        </Bubble>,
      );
      const frames = framesOf(contentOf(variant));
      expect(frames, variant).toHaveLength(2);
      for (const frame of frames) expect(frame.getAttribute("data-fill"), variant).toBe(fill);
      cleanup();
    }
    render(
      <Bubble variant="ghost">
        <BubbleContent>ghost</BubbleContent>
      </Bubble>,
    );
    expect(framesOf(contentOf("ghost"))).toHaveLength(0);
  });

  it("uses no CSS border or grey fill for its own bubble and inks a tone for muted", () => {
    render(
      <>
        <Bubble data-testid="mine">
          <BubbleContent>mine</BubbleContent>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent>muted</BubbleContent>
        </Bubble>
        <Bubble variant="tinted" data-testid="tinted">
          <BubbleContent>tinted</BubbleContent>
        </Bubble>
      </>,
    );
    const mine = contentOf("mine");
    expect(mine.classList.contains("border-0")).toBe(true);
    expect(mine.classList.contains("overflow-hidden")).toBe(false);
    expect(screen.getByTestId("mine").className).toContain(
      "*:data-[slot=bubble-content]:bg-primary",
    );
    expect(framesOf(contentOf("muted"))[0]?.className).toContain("[--tone-2:var(--tone-1)]");
    expect(screen.getByTestId("tinted").className).toContain(
      "*:data-[slot=bubble-content]:halftone-light",
    );
  });

  it("has a plain and a tailed outline, the tailed one shown on the last of a run", () => {
    const observers = stubResizeObserver();
    render(
      <Bubble variant="secondary">
        <BubbleContent>Hi</BubbleContent>
      </Bubble>,
    );
    observers.drawAll(120, 40);
    const [plain, tailed] = framesOf(contentOf("Hi"));
    expect(plain?.className).toContain(":hidden");
    expect(tailed?.classList.contains("hidden")).toBe(true);
    expect(tailed?.className).toContain(
      "[[data-slot=bubble]:not([data-align=start]:has(+[data-slot=bubble][data-align=start])):not([data-align=end]:has(+[data-slot=bubble][data-align=end]))>[data-slot=bubble-content]>&]:block",
    );
    // The tail reaches below the box: the tailed path goes well past y = 40 (the drawing's
    // own coordinates; the padding is a transform), the plain one only wobbles around it.
    const lowest = (frame: HTMLElement | undefined) =>
      Math.max(
        ...[...(frame?.querySelectorAll("path") ?? [])].flatMap((path) =>
          [...(path.getAttribute("d") ?? "").matchAll(/-?\d+(?:\.\d+)?/g)]
            .filter((_, i) => i % 2 === 1)
            .map(([n]) => Number(n)),
        ),
      );
    expect(lowest(tailed)).toBeGreaterThan(45);
    expect(lowest(plain)).toBeLessThan(45);
  });

  it("mirrors the outline for end-aligned bubbles and messages", () => {
    render(
      <Bubble align="end">
        <BubbleContent>Mine</BubbleContent>
      </Bubble>,
    );
    for (const frame of framesOf(contentOf("Mine"))) {
      expect(frame.className).toContain("group-data-[align=end]/bubble:-scale-x-100");
      expect(frame.className).toContain("group-data-[align=end]/message:-scale-x-100");
    }
  });

  it("gives a rendered button the ink hover and keeps it a button", () => {
    render(
      <Bubble data-testid="bubble">
        <BubbleContent render={<button type="button" />}>Open</BubbleContent>
      </Bubble>,
    );
    const button = screen.getByRole("button", { name: "Open" });
    expect(button.getAttribute("data-slot")).toBe("bubble-content");
    expect(screen.getByTestId("bubble").className).toContain(
      "[&>[data-slot=bubble-content]:is(button,a):hover>[data-slot=ink-frame]]:opacity-80",
    );
  });

  it("draws reactions as an outlined paper chip", () => {
    render(
      <Bubble>
        <BubbleContent>Hi</BubbleContent>
        <BubbleReactions data-testid="reactions" side="top" align="start">
          3
        </BubbleReactions>
      </Bubble>,
    );
    const reactions = screen.getByTestId("reactions");
    const [frame] = framesOf(reactions);
    expect(reactions.firstElementChild).toBe(frame);
    expect(frame?.getAttribute("data-fill")).toBe("paper");
    expect(reactions.classList.contains("left-3")).toBe(true);
    expect(reactions.classList.contains("-translate-y-3/4")).toBe(true);
    expect(reactions.className).not.toContain("ring-");
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
