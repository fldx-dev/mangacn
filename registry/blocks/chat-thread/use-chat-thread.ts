"use client";

import * as React from "react";

/** Who wrote a message. */
export interface ChatAuthor {
  /** The author's id; the thread's `me` names one of these. */
  id: string;
  /** The name shown over their messages and read out when one arrives. */
  name: string;
  /** A picture URL for their avatar; their initials are shown without one. */
  avatar?: string;
}

/** A file sent with a message. */
export interface ChatAttachment {
  /** A stable id, for React's key; the name and position are used without one. */
  id?: string;
  /** The file's name, as the card's title. */
  name: string;
  /** Where the file opens: the card becomes a link to it. */
  url?: string;
  /** Its MIME type (`image/png`); the card's description shows the subtype, `PNG`. */
  type?: string;
  /** Its size in bytes; the description shows it as `1.1 MB`. */
  size?: number;
  /** A small picture of it (an image URL), shown in place of the file icon. */
  thumbnail?: string;
}

/** A reaction to a message and how many people gave it. */
export interface ChatReaction {
  /** The reaction, usually an emoji. */
  emoji: string;
  /** How many people reacted with it. */
  count: number;
}

/** One message of the thread, in the shape a chat backend usually sends. */
export interface ChatMessage {
  /** A stable id: React's key, and what `unreadFrom` names. */
  id: string;
  /** Who wrote it. */
  author: ChatAuthor;
  /** The message's text; line breaks are kept. May be empty when it carries attachments. */
  text: string;
  /**
   * When it was sent: an ISO 8601 string (`2026-11-11T21:04:00+09:00`) or a Date. A string's
   * date and time are shown as written in it; a Date's in UTC, unless the thread has a
   * `timeZone`.
   */
  at: string | Date;
  /** Files sent with it, shown as cards inside the bubble. */
  attachments?: ChatAttachment[];
  /** Reactions to it, in a chip on the bubble's edge. */
  reactions?: ChatReaction[];
}

/** A moment's wall-clock parts: what the thread shows for a message's `at`. */
export interface ChatMoment {
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
  hour: number;
  minute: number;
}

// `2026-11-11T21:04` with anything after it (seconds, `Z`, an offset): the parts as written.
const ISO_PREFIX = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Numeric parts in a time zone, from a formatter kept per zone. */
function zoneParts(date: Date, timeZone: string): ChatMoment {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    });
    formatters.set(timeZone, format);
  }
  const parts = Object.fromEntries(
    format.formatToParts(date).map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    // Some engines write midnight as 24 even in the h23 cycle.
    hour: parts.hour % 24,
    minute: parts.minute,
  };
}

/**
 * A message's moment as the thread shows it. Without `timeZone`, an ISO string's date and time
 * as written in it (`…T21:04+09:00` → 21:04) and a Date's in UTC; with one, either in that zone.
 * The same on the server and in the browser, whatever their own zones, so the page hydrates.
 * `undefined` when `at` is no date.
 */
export function chatMoment(at: string | Date, timeZone?: string): ChatMoment | undefined {
  if (typeof at === "string" && !timeZone) {
    const match = ISO_PREFIX.exec(at.trim());
    if (match) {
      const [year, month, day, hour, minute] = match.slice(1).map((part) => Number(part ?? 0));
      return { year, month, day, hour, minute };
    }
  }
  const date = typeof at === "string" ? new Date(at) : at;
  if (Number.isNaN(date.getTime())) return undefined;
  return zoneParts(date, timeZone ?? "UTC");
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (value: number) => String(value).padStart(2, "0");

/** The moment's day as a key and a `<time>` value: `2026-11-11`. */
export function chatDayKey({ year, month, day }: ChatMoment): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * The date line's words, in English whatever the browser's locale (so server and browser
 * agree): `Wednesday 11 November 2026`.
 */
export function formatChatDay({ year, month, day }: ChatMoment): string {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${WEEKDAYS[weekday]} ${day} ${MONTHS[month - 1]} ${year}`;
}

/** The time under a message, on the 24-hour clock: `21:04`. */
export function formatChatTime({ hour, minute }: ChatMoment): string {
  return `${pad(hour)}:${pad(minute)}`;
}

/** The current moment as an ISO string in the browser's own offset: `2026-11-12T08:15:30+07:00`. */
export function localChatTimestamp(now: Date = new Date()): string {
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const zone = `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}${zone}`
  );
}

let sequence = 0;

/** A fresh message id: a UUID where the browser has them. */
function messageId(): string {
  sequence += 1;
  return globalThis.crypto?.randomUUID?.() ?? `message-${Date.now()}-${sequence}`;
}

export interface UseChatThreadOptions {
  /** The messages the thread opens with, oldest first. */
  initial?: ChatMessage[];
  /**
   * Who is writing: an author, or the id of one who wrote in `initial` (an unknown id becomes
   * an author named "You"). `send` writes as them.
   */
  me: string | ChatAuthor;
}

export interface ChatThreadState {
  /** The thread's messages, oldest first: what the block's `messages` takes. */
  messages: ChatMessage[];
  /** The id of the author who writes: what the block's `me` takes. */
  me: string;
  /**
   * Adds a message from `me` with the trimmed text, sent now (in the browser's own offset), and
   * returns it; an empty text adds nothing. What the block's `onSend` takes.
   */
  send: (text: string, attachments?: ChatAttachment[]) => ChatMessage | undefined;
  /** Adds a message from anyone (a reply from your socket); one whose id is there is skipped. */
  receive: (message: ChatMessage) => void;
  /** Replaces the messages, as React's state setter does. */
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

/**
 * The messages of a thread kept in React state, for an app with no store yet: `send` adds
 * yours, `receive` adds anyone's. The block stays controlled; pass `messages`, `me` and `send`
 * to it. With a store or a server, keep the messages there and pass them instead.
 */
export function useChatThread({ initial = [], me }: UseChatThreadOptions): ChatThreadState {
  const [messages, setMessages] = React.useState<ChatMessage[]>(initial);
  const [author] = React.useState<ChatAuthor>(() =>
    typeof me === "string"
      ? (initial.find((message) => message.author.id === me)?.author ?? { id: me, name: "You" })
      : me,
  );

  const send = React.useCallback(
    (text: string, attachments?: ChatAttachment[]) => {
      const trimmed = text.trim();
      if (!trimmed && !attachments?.length) return undefined;
      const message: ChatMessage = {
        id: messageId(),
        author,
        text: trimmed,
        at: localChatTimestamp(),
        ...(attachments?.length ? { attachments } : {}),
      };
      setMessages((current) => [...current, message]);
      return message;
    },
    [author],
  );

  const receive = React.useCallback((message: ChatMessage) => {
    setMessages((current) =>
      current.some((existing) => existing.id === message.id) ? current : [...current, message],
    );
  }, []);

  return { messages, me: author.id, send, receive, setMessages };
}
