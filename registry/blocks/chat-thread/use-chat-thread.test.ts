import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  type ChatMessage,
  chatDayKey,
  chatMoment,
  formatChatDay,
  formatChatTime,
  localChatTimestamp,
  useChatThread,
} from "./use-chat-thread";

const hana = { id: "hana", name: "Hana Mori" };
const ren = { id: "ren", name: "Ren" };
const initial: ChatMessage[] = [
  { id: "m1", author: hana, text: "Hello", at: "2026-11-11T21:04:00+09:00" },
  { id: "m2", author: ren, text: "Hi", at: "2026-11-11T21:05:00+09:00" },
];

describe("chatMoment", () => {
  it("reads an ISO string's date and time as written, whatever its offset", () => {
    expect(chatMoment("2026-11-11T21:04:00+09:00")).toEqual({
      year: 2026,
      month: 11,
      day: 11,
      hour: 21,
      minute: 4,
    });
    expect(chatMoment("2026-11-11T23:30:00.000Z")).toMatchObject({ day: 11, hour: 23 });
    expect(chatMoment("2026-11-11")).toMatchObject({ day: 11, hour: 0, minute: 0 });
  });

  it("reads a Date in UTC, and anything in a time zone when given one", () => {
    const date = new Date("2026-11-11T23:30:00Z");
    expect(chatMoment(date)).toMatchObject({ day: 11, hour: 23, minute: 30 });
    expect(chatMoment(date, "Asia/Tokyo")).toMatchObject({ day: 12, hour: 8, minute: 30 });
    expect(chatMoment("2026-11-11T21:04:00+09:00", "UTC")).toMatchObject({ hour: 12 });
    expect(chatMoment(new Date("2026-11-11T15:00:00Z"), "Asia/Tokyo")).toMatchObject({
      day: 12,
      hour: 0,
    });
  });

  it("is undefined for no date", () => {
    expect(chatMoment("yesterday")).toBeUndefined();
    expect(chatMoment(new Date(Number.NaN))).toBeUndefined();
  });
});

describe("formatting", () => {
  it("writes the day line in English and the time on the 24-hour clock", () => {
    const moment = chatMoment("2026-11-11T09:04:00+09:00");
    if (!moment) throw new Error("no moment");
    expect(chatDayKey(moment)).toBe("2026-11-11");
    expect(formatChatDay(moment)).toBe("Wednesday 11 November 2026");
    expect(formatChatTime(moment)).toBe("09:04");
  });

  it("stamps now in the local offset, which reads back as the local wall clock", () => {
    const now = new Date(2026, 10, 12, 8, 15, 30);
    const stamp = localChatTimestamp(now);
    expect(stamp).toMatch(/^2026-11-12T08:15:30[+-]\d{2}:\d{2}$/);
    expect(new Date(stamp).getTime()).toBe(now.getTime());
  });
});

describe("useChatThread", () => {
  it("sends as me with the trimmed text, and skips an empty one", () => {
    const { result } = renderHook(() => useChatThread({ initial, me: "ren" }));
    expect(result.current.me).toBe("ren");
    let sent: ChatMessage | undefined;
    act(() => {
      sent = result.current.send("  See you at six \n");
    });
    expect(sent?.author).toEqual(ren);
    expect(sent?.text).toBe("See you at six");
    expect(chatMoment(sent?.at ?? "")).toBeDefined();
    expect(result.current.messages.map((message) => message.id)).toEqual(["m1", "m2", sent?.id]);
    act(() => {
      expect(result.current.send("   ")).toBeUndefined();
    });
    expect(result.current.messages).toHaveLength(3);
  });

  it("names an unknown me 'You', and takes an author", () => {
    const unknown = renderHook(() => useChatThread({ me: "kai" }));
    act(() => {
      unknown.result.current.send("Hi");
    });
    expect(unknown.result.current.messages[0]?.author).toEqual({ id: "kai", name: "You" });
    const known = renderHook(() => useChatThread({ me: { id: "kai", name: "Kai" } }));
    expect(known.result.current.me).toBe("kai");
  });

  it("receives anyone's message once", () => {
    const { result } = renderHook(() => useChatThread({ initial, me: "ren" }));
    const reply = { id: "m3", author: hana, text: "Great", at: "2026-11-11T21:06:00+09:00" };
    act(() => {
      result.current.receive(reply);
      result.current.receive(reply);
    });
    expect(result.current.messages.map((message) => message.id)).toEqual(["m1", "m2", "m3"]);
  });
});
