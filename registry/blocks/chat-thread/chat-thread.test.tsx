import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import { stubResizeObserver } from "@/lib/test/resize-observer";
import { type ChatMessage, ChatThread } from "./chat-thread";

// jsdom lays nothing out, so the scroller's own following cannot be seen here (its tests and
// the e2e run cover it); the block's part is when it asks the scroller for the end.
const scroller = vi.hoisted(() => ({ scrollToEnd: vi.fn(() => true) }));
vi.mock("@/components/ui/message-scroller", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui/message-scroller")>();
  return {
    ...actual,
    useMessageScroller: () => ({ ...actual.useMessageScroller(), ...scroller }),
  };
});

beforeAll(() => {
  stubResizeObserver();
});

beforeEach(() => {
  scroller.scrollToEnd.mockClear();
});

afterEach(cleanup);

const hana = { id: "hana", name: "Hana Mori" };
const ren = { id: "ren", name: "Ren" };

const thread: ChatMessage[] = [
  { id: "m1", author: hana, text: "The editor read the draft.", at: "2026-11-11T20:58:00+09:00" },
  { id: "m2", author: hana, text: "Two more pages.", at: "2026-11-11T20:59:00+09:00" },
  {
    id: "m3",
    author: ren,
    text: "Rain and speed lines.",
    at: "2026-11-11T21:04:00+09:00",
    reactions: [{ emoji: "👍", count: 2 }],
  },
  { id: "m4", author: hana, text: "Good night.", at: "2026-11-11T23:10:00+09:00" },
  { id: "m5", author: hana, text: "Morning!", at: "2026-11-12T08:15:00+09:00" },
];

const field = () => screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement;
const sendButton = () => screen.getByRole("button", { name: "Send" }) as HTMLButtonElement;
const announcer = () => document.querySelector<HTMLElement>('[data-slot="chat-thread-announcer"]');
const groups = () => [...document.querySelectorAll<HTMLElement>('[data-slot="bubble-group"]')];
const bubbleIds = (group: HTMLElement) =>
  [...group.querySelectorAll<HTMLElement>('[data-slot="bubble"]')].map((b) => b.dataset.messageId);

function type(text: string) {
  fireEvent.change(field(), { target: { value: text } });
}

describe("ChatThread", () => {
  it("is a region named by label, whose log leaves announcing to the live region", () => {
    render(<ChatThread messages={thread} me="ren" label="Chat with Hana" className="h-96" />);
    const region = screen.getByRole("region", { name: "Chat with Hana" });
    const log = within(region).getByRole("log");
    expect(log.getAttribute("aria-live")).toBe("off");
    expect(announcer()?.getAttribute("aria-live")).toBe("polite");
    expect(document.querySelector('[data-slot="chat-thread"]')?.classList.contains("h-96")).toBe(
      true,
    );
  });

  it("groups consecutive messages of one author, one group per run and day", () => {
    render(<ChatThread messages={thread} me="ren" />);
    expect(groups().map(bubbleIds)).toEqual([["m1", "m2"], ["m3"], ["m4"], ["m5"]]);
    // Mine sit at the end, ink-filled; everyone else's are paper.
    const mine = document.querySelector<HTMLElement>('[data-message-id="m3"]');
    expect(mine?.dataset.align).toBe("end");
    expect(mine?.dataset.variant).toBe("default");
    const theirs = document.querySelector<HTMLElement>('[data-message-id="m1"]');
    expect(theirs?.dataset.align).toBe("start");
    expect(theirs?.dataset.variant).toBe("secondary");
    // Their name is shown once per group; mine is for screen readers only.
    const headers = [...document.querySelectorAll<HTMLElement>('[data-slot="message-header"]')];
    expect(headers.map((header) => header.textContent)).toEqual([
      "Hana Mori",
      "Ren",
      "Hana Mori",
      "Hana Mori",
    ]);
    expect(headers[1]?.classList.contains("sr-only")).toBe(true);
  });

  it("draws a date line where the day changes, and shows times as written", () => {
    render(<ChatThread messages={thread} me="ren" />);
    const content = document.querySelector('[data-slot="message-scroller-content"]');
    const order = [...(content?.children ?? [])]
      .map((child) =>
        child.getAttribute("data-slot") === "marker"
          ? `day ${child.querySelector("time")?.getAttribute("datetime")}`
          : child.getAttribute("data-message-id"),
      )
      .filter(Boolean);
    expect(order).toEqual([
      "day 2026-11-11",
      "group-m1",
      "group-m3",
      "group-m4",
      "day 2026-11-12",
      "group-m5",
    ]);
    const markers = screen.getAllByText(/November 2026$/);
    expect(markers.map((marker) => marker.textContent)).toEqual([
      "Wednesday 11 November 2026",
      "Thursday 12 November 2026",
    ]);
    const times = [...document.querySelectorAll('[data-slot="message-footer"] time')];
    expect(times.map((time) => time.textContent)).toEqual(["20:59", "21:04", "23:10", "08:15"]);
    expect(times[0]?.getAttribute("datetime")).toBe("2026-11-11T20:59:00+09:00");
  });

  it("shows times in a time zone when given one", () => {
    const at = new Date("2026-11-11T23:10:00Z");
    render(<ChatThread messages={[{ ...thread[0], at }]} me="ren" timeZone="Asia/Tokyo" />);
    expect(screen.getByText("Thursday 12 November 2026")).toBeTruthy();
    expect(document.querySelector('[data-slot="message-footer"] time')?.textContent).toBe("08:10");
  });

  it("puts a New messages line above the first unread message, splitting its group", () => {
    render(<ChatThread messages={thread} me="ren" unreadFrom="m2" />);
    const unread = document.querySelector<HTMLElement>("[data-unread]");
    expect(unread?.textContent).toBe("New messages");
    expect(unread?.previousElementSibling?.getAttribute("data-message-id")).toBe("group-m1");
    expect(unread?.nextElementSibling?.getAttribute("data-message-id")).toBe("group-m2");
    expect(groups().map(bubbleIds)).toEqual([["m1"], ["m2"], ["m3"], ["m4"], ["m5"]]);
  });

  it("shows attachments in their bubble and reactions on it", () => {
    const withFiles: ChatMessage = {
      id: "f",
      author: hana,
      text: "",
      at: "2026-11-12T09:00:00+09:00",
      attachments: [
        { name: "page-01.png", type: "image/png", size: 1_120_000, url: "/files/page-01.png" },
        { name: "notes.pdf", size: 380_000 },
      ],
      reactions: [{ emoji: "🔥", count: 3 }],
    };
    render(<ChatThread messages={[withFiles]} me="ren" />);
    const bubble = document.querySelector<HTMLElement>('[data-message-id="f"]');
    if (!bubble) throw new Error("no bubble");
    const cards = bubble.querySelectorAll('[data-slot="attachment"]');
    expect(cards).toHaveLength(2);
    expect(cards[0]?.textContent).toBe("page-01.pngPNG · 1.1 MB");
    expect(cards[1]?.textContent).toBe("notes.pdfPDF · 380 KB");
    const link = within(bubble).getByRole("link", { name: "Open page-01.png" });
    expect(link.getAttribute("href")).toBe("/files/page-01.png");
    expect(bubble.querySelector('[data-slot="bubble-reactions"]')?.textContent).toBe(
      "Reactions:🔥3",
    );
  });

  it("shows the empty state with no messages", () => {
    render(<ChatThread messages={[]} me="ren" onSend={() => {}} />);
    expect(screen.getByText("No messages yet")).toBeTruthy();
    expect(groups()).toHaveLength(0);
  });

  it("has no composer without onSend", () => {
    render(<ChatThread messages={thread} me="ren" />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
  });

  describe("sending", () => {
    it("sends the trimmed text on Enter, clears the field, keeps focus and scrolls to the end", () => {
      const onSend = vi.fn();
      render(<ChatThread messages={thread} me="ren" onSend={onSend} placeholder="Write…" />);
      expect(field().placeholder).toBe("Write…");
      field().focus();
      type("  See you at six \n");
      fireEvent.keyDown(field(), { key: "Enter" });
      expect(onSend).toHaveBeenCalledExactlyOnceWith("See you at six");
      expect(field().value).toBe("");
      expect(document.activeElement).toBe(field());
      expect(scroller.scrollToEnd).toHaveBeenCalled();
    });

    it("sends with the button and puts the focus back in the field", () => {
      const onSend = vi.fn();
      render(<ChatThread messages={thread} me="ren" onSend={onSend} />);
      type("On my way");
      sendButton().focus();
      fireEvent.click(sendButton());
      expect(onSend).toHaveBeenCalledExactlyOnceWith("On my way");
      expect(field().value).toBe("");
      expect(document.activeElement).toBe(field());
    });

    it("breaks the line on Shift+Enter, and does not send during an IME composition", () => {
      const onSend = vi.fn();
      render(<ChatThread messages={thread} me="ren" onSend={onSend} />);
      type("また明日");
      expect(fireEvent.keyDown(field(), { key: "Enter", shiftKey: true })).toBe(true);
      expect(fireEvent.keyDown(field(), { key: "Enter", isComposing: true })).toBe(true);
      // Safari ends a composition with an Enter whose keyCode is 229.
      expect(fireEvent.keyDown(field(), { key: "Enter", keyCode: 229 })).toBe(true);
      expect(onSend).not.toHaveBeenCalled();
      expect(field().value).toBe("また明日");
      fireEvent.keyDown(field(), { key: "Enter" });
      expect(onSend).toHaveBeenCalledExactlyOnceWith("また明日");
    });

    it("does not send an empty or blank message", () => {
      const onSend = vi.fn();
      render(<ChatThread messages={thread} me="ren" onSend={onSend} />);
      fireEvent.keyDown(field(), { key: "Enter" });
      fireEvent.click(sendButton());
      type("   \n  ");
      fireEvent.keyDown(field(), { key: "Enter" });
      fireEvent.click(sendButton());
      expect(onSend).not.toHaveBeenCalled();
      // The button stays enabled, so the group keeps its ordinary look.
      expect(sendButton().disabled).toBe(false);
    });
  });

  describe("arrivals", () => {
    const reply = (id: string, text: string): ChatMessage => ({
      id,
      author: hana,
      text,
      at: "2026-11-12T08:30:00+09:00",
    });

    it("announces nothing on the first render", () => {
      render(<ChatThread messages={thread} me="ren" />);
      expect(announcer()?.textContent).toBe("");
    });

    it("announces each new message from someone else once, as Name: text", () => {
      const { rerender } = render(<ChatThread messages={thread} me="ren" />);
      const next = [...thread, reply("r1", "See you at six")];
      rerender(<ChatThread messages={next} me="ren" />);
      expect(announcer()?.textContent).toBe("Hana Mori: See you at six");
      expect(announcer()?.children).toHaveLength(1);
      const before = announcer()?.firstElementChild;
      // The same messages again (a re-render, a new array) announce nothing new.
      rerender(<ChatThread messages={[...next]} me="ren" />);
      expect(announcer()?.firstElementChild).toBe(before);
      // Your own messages are not announced.
      const mine: ChatMessage = { ...reply("r2", "Great"), author: ren };
      rerender(<ChatThread messages={[...next, mine]} me="ren" />);
      expect(announcer()?.textContent).toBe("Hana Mori: See you at six");
      expect(announcer()?.firstElementChild).toBe(before);
    });

    it("holds only the latest when several arrive at once, and names files with no text", () => {
      const { rerender } = render(<ChatThread messages={thread} me="ren" />);
      const file = { ...reply("r2", ""), attachments: [{ name: "page-02.png" }] };
      rerender(<ChatThread messages={[...thread, reply("r1", "First"), file]} me="ren" />);
      expect(announcer()?.textContent).toBe("Hana Mori: page-02.png");
      expect(announcer()?.children).toHaveLength(1);
    });

    it("does not scroll for someone else's message, and follows a message of yours", () => {
      const { rerender } = render(<ChatThread messages={thread} me="ren" />);
      rerender(<ChatThread messages={[...thread, reply("r1", "Hi")]} me="ren" />);
      expect(scroller.scrollToEnd).not.toHaveBeenCalled();
      const mine: ChatMessage = { ...reply("r2", "Hello"), author: ren };
      rerender(<ChatThread messages={[...thread, reply("r1", "Hi"), mine]} me="ren" />);
      expect(scroller.scrollToEnd).toHaveBeenCalledTimes(1);
    });
  });

  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
