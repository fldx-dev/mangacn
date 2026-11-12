"use client";

import { cn } from "cn";
import { ArrowUpIcon, FileIcon } from "lucide-react";
import * as React from "react";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/components/ui/bubble";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
} from "@/components/ui/message-scroller";
import {
  type ChatAttachment,
  type ChatAuthor,
  type ChatMessage,
  chatDayKey,
  chatMoment,
  formatChatDay,
  formatChatTime,
} from "./use-chat-thread";

// The messages' shape and the state for an app with no store yet.
export type {
  ChatAttachment,
  ChatAuthor,
  ChatMessage,
  ChatMoment,
  ChatReaction,
  ChatThreadState,
  UseChatThreadOptions,
} from "./use-chat-thread";
export {
  chatDayKey,
  chatMoment,
  formatChatDay,
  formatChatTime,
  localChatTimestamp,
  useChatThread,
} from "./use-chat-thread";

export interface ChatThreadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  /** The conversation, oldest first. Keep it in your store, or in `useChatThread`. */
  messages: ChatMessage[];
  /** The id of the author whose messages are yours: they sit at the end, filled with ink. */
  me: string;
  /**
   * Called with the trimmed text when the reader sends a message (Enter, or the Send button).
   * Add the message to `messages` yourself; the field is cleared and keeps the focus. Leave
   * it out for a thread that is only read: there is no composer then.
   */
  onSend?: (text: string) => void;
  /**
   * The composer's placeholder.
   * @default "Write a message…"
   */
  placeholder?: string;
  /**
   * The thread's accessible name: the scrolling region's label.
   * @default "Conversation"
   */
  label?: string;
  /** The id of the first message the reader has not seen: a "New messages" line goes above it. */
  unreadFrom?: string;
  /**
   * An IANA time zone (`Asia/Tokyo`) to show every `at` in. Without it, an ISO string's time is
   * shown as written in it and a Date's in UTC. Pass the reader's zone from their profile (not
   * the browser's, which the server cannot know) so the page hydrates.
   */
  timeZone?: string;
}

/** Consecutive messages of one author on one day: one bubble group, one tail. */
type Row =
  | { kind: "day"; key: string; day: string; label: string }
  | { kind: "unread"; key: string }
  | { kind: "group"; key: string; author: ChatAuthor; messages: ChatMessage[] };

/** The thread's rows: a date line where the day changes, the unread line, then the groups. */
function threadRows(messages: ChatMessage[], unreadFrom?: string, timeZone?: string): Row[] {
  const rows: Row[] = [];
  let day: string | undefined;
  for (const message of messages) {
    const moment = chatMoment(message.at, timeZone);
    const key = moment ? chatDayKey(moment) : undefined;
    if (moment && key && key !== day) {
      rows.push({ kind: "day", key: `day-${key}`, day: key, label: formatChatDay(moment) });
      day = key;
    }
    if (message.id === unreadFrom) rows.push({ kind: "unread", key: "unread" });
    const last = rows.at(-1);
    if (last?.kind === "group" && last.author.id === message.author.id) {
      last.messages.push(message);
    } else {
      rows.push({
        kind: "group",
        key: `group-${message.id}`,
        author: message.author,
        messages: [message],
      });
    }
  }
  return rows;
}

/** "Hana Mori" → "HM". */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** "PNG · 1.1 MB": the MIME subtype (or the name's extension) and the size. */
function attachmentDescription({ name, type, size }: ChatAttachment): string {
  const subtype = type?.split("/")[1]?.split(/[+;.-]/)[0];
  const extension = /\.([a-z0-9]{1,5})$/i.exec(name)?.[1];
  const kind = (subtype ?? extension)?.toUpperCase();
  let amount: string | undefined;
  if (size !== undefined && Number.isFinite(size) && size >= 0) {
    const units = ["B", "KB", "MB", "GB"];
    let value = size;
    let unit = 0;
    while (value >= 1000 && unit < units.length - 1) {
      value /= 1000;
      unit += 1;
    }
    const digits = unit === 0 || value >= 10 ? 0 : 1;
    amount = `${value.toFixed(digits)} ${units[unit]}`;
  }
  return [kind, amount].filter(Boolean).join(" · ");
}

/** What the live region reads for a message: its text, or its files' names. */
function spoken(message: ChatMessage): string {
  const text = message.text.trim();
  if (text) return text;
  return (message.attachments ?? []).map((file) => file.name).join(", ");
}

/** The time under a group: its last message's. */
function MessageTime({ at, timeZone }: { at: string | Date; timeZone?: string }) {
  const moment = chatMoment(at, timeZone);
  if (!moment) return null;
  const dateTime = typeof at === "string" ? at : at.toISOString();
  return <time dateTime={dateTime}>{formatChatTime(moment)}</time>;
}

function MessageFiles({ files }: { files: ChatAttachment[] }) {
  return (
    // Wraps rather than scrolls, so a narrow bubble shows every file whole.
    <AttachmentGroup className="flex-wrap">
      {files.map((file, index) => {
        const description = attachmentDescription(file);
        return (
          <Attachment key={file.id ?? `${index}-${file.name}`} size="sm">
            <AttachmentMedia variant={file.thumbnail ? "image" : "icon"}>
              {file.thumbnail ? (
                // biome-ignore lint/performance/noImgElement: framework-free; any image URL works.
                <img src={file.thumbnail} alt="" />
              ) : (
                <FileIcon aria-hidden="true" />
              )}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{file.name}</AttachmentTitle>
              {description && <AttachmentDescription>{description}</AttachmentDescription>}
            </AttachmentContent>
            {file.url && (
              <AttachmentTrigger
                render={<a href={file.url} target="_blank" rel="noopener noreferrer" />}
                aria-label={`Open ${file.name}`}
              />
            )}
          </Attachment>
        );
      })}
    </AttachmentGroup>
  );
}

function MessageRow({
  author,
  messages,
  mine,
  timeZone,
}: {
  author: ChatAuthor;
  messages: ChatMessage[];
  mine: boolean;
  timeZone?: string;
}) {
  const last = messages.at(-1);
  return (
    <Message align={mine ? "end" : "start"}>
      {!mine && (
        // The name is in the header; the picture or initials add nothing to read.
        <MessageAvatar aria-hidden="true">
          <Avatar>
            {author.avatar && <AvatarImage src={author.avatar} alt="" />}
            <AvatarFallback>{initials(author.name)}</AvatarFallback>
          </Avatar>
        </MessageAvatar>
      )}
      <MessageContent>
        {/* Your own name is not shown, but a screen reader still hears who wrote. */}
        <MessageHeader className={cn(mine && "sr-only")}>{author.name}</MessageHeader>
        {/* Full width, so each bubble's 80 % is of the message, not of the widest bubble. */}
        <BubbleGroup className="w-full">
          {messages.map((message) => {
            const files = message.attachments ?? [];
            const reactions = message.reactions?.filter((reaction) => reaction.count > 0) ?? [];
            return (
              <Bubble
                key={message.id}
                data-message-id={message.id}
                variant={mine ? "default" : "secondary"}
                align={mine ? "end" : "start"}
                className={cn(reactions.length > 0 && "mb-4")}
              >
                <BubbleContent className={cn(files.length > 0 && "p-1")}>
                  {message.text && (
                    <p className={cn("whitespace-pre-wrap", files.length > 0 && "px-2 pt-1")}>
                      {message.text}
                    </p>
                  )}
                  {files.length > 0 && <MessageFiles files={files} />}
                </BubbleContent>
                {reactions.length > 0 && (
                  // Away from the tail: the tail is on the side the bubble is aligned to.
                  <BubbleReactions align={mine ? "start" : "end"}>
                    <span className="sr-only">Reactions:</span>
                    {reactions.map((reaction) => (
                      <span key={reaction.emoji} className="flex items-center gap-0.5 text-xs">
                        <span>{reaction.emoji}</span>
                        {reaction.count}
                      </span>
                    ))}
                  </BubbleReactions>
                )}
              </Bubble>
            );
          })}
        </BubbleGroup>
        {last && (
          <MessageFooter>
            <MessageTime at={last.at} timeZone={timeZone} />
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}

function ChatThreadBody({
  messages,
  me,
  onSend,
  placeholder = "Write a message…",
  label = "Conversation",
  unreadFrom,
  timeZone,
  className,
  ...props
}: ChatThreadProps) {
  const { scrollToEnd } = useMessageScroller();
  const field = React.useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = React.useState("");
  const [announcement, setAnnouncement] = React.useState<{ id: string; text: string }>();
  const rows = React.useMemo(
    () => threadRows(messages, unreadFrom, timeZone),
    [messages, unreadFrom, timeZone],
  );

  // Messages already on screen: the first render's are not news, so nothing is announced then.
  const seen = React.useRef<Set<string>>(null);
  const lastMine = React.useRef<string>(undefined);
  React.useEffect(() => {
    const last = messages.at(-1);
    if (seen.current === null) {
      seen.current = new Set(messages.map((message) => message.id));
      lastMine.current = last?.author.id === me ? last.id : undefined;
      return;
    }
    let latest: ChatMessage | undefined;
    for (const message of messages) {
      if (seen.current.has(message.id)) continue;
      seen.current.add(message.id);
      if (message.author.id !== me) latest = message;
    }
    if (latest)
      setAnnouncement({ id: latest.id, text: `${latest.author.name}: ${spoken(latest)}` });
    // A message of yours that just arrived (sent here, or from your other device) is followed.
    if (last && last.author.id === me && last.id !== lastMine.current) {
      lastMine.current = last.id;
      scrollToEnd();
    }
  }, [messages, me, scrollToEnd]);

  const send = () => {
    const text = draft.trim();
    if (!text || !onSend) return;
    onSend(text);
    setDraft("");
    field.current?.focus();
    // Follow the thread to its end, where the message lands once `messages` has it.
    scrollToEnd();
  };

  return (
    <div
      data-slot="chat-thread"
      className={cn("flex h-full min-h-0 w-full min-w-0 flex-col gap-3 text-foreground", className)}
      {...props}
    >
      <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerViewport aria-label={label}>
          {/* A log announces what is added to it; the live region below speaks instead, once. */}
          <MessageScrollerContent aria-live="off" className="gap-4 p-3 sm:px-4">
            {rows.length === 0 && (
              <Empty className="flex-1">
                <EmptyHeader>
                  <EmptyMedia />
                  <EmptyTitle>No messages yet</EmptyTitle>
                  <EmptyDescription>
                    {onSend ? "Say hello to start the conversation." : "Nothing has been said."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            {rows.map((row) => {
              if (row.kind === "day") {
                return (
                  <Marker key={row.key} variant="separator">
                    <MarkerContent>
                      <time dateTime={row.day}>{row.label}</time>
                    </MarkerContent>
                  </Marker>
                );
              }
              if (row.kind === "unread") {
                return (
                  // The surface's one spot: rule and label.
                  <Marker
                    key={row.key}
                    variant="separator"
                    data-unread=""
                    className="text-spot [--ink:var(--spot)]"
                  >
                    <MarkerContent>New messages</MarkerContent>
                  </Marker>
                );
              }
              return (
                <MessageScrollerItem key={row.key} messageId={row.key}>
                  <MessageRow
                    author={row.author}
                    messages={row.messages}
                    mine={row.author.id === me}
                    timeZone={timeZone}
                  />
                </MessageScrollerItem>
              );
            })}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
      <div data-slot="chat-thread-announcer" aria-live="polite" className="sr-only">
        {announcement && <p key={announcement.id}>{announcement.text}</p>}
      </div>
      {onSend && (
        <form
          data-slot="chat-thread-composer"
          className="shrink-0"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <InputGroup>
            <InputGroupTextarea
              ref={field}
              rows={1}
              value={draft}
              placeholder={placeholder}
              aria-label="Message"
              className="max-h-40 min-h-10 overflow-y-auto"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends; Shift+Enter breaks the line; Enter that ends an IME composition
                // (Japanese, Chinese, Korean input) only commits the text.
                if (event.key !== "Enter" || event.shiftKey) return;
                if (event.nativeEvent.isComposing || event.keyCode === 229) return;
                event.preventDefault();
                send();
              }}
            />
            <InputGroupAddon align="inline-end" className="self-end">
              {/* Never disabled: a disabled control turns the whole group to its disabled look;
                  a blank message is simply not sent. */}
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                aria-label="Send"
                className="size-9 pointer-coarse:size-11"
              >
                <ArrowUpIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      )}
    </div>
  );
}

/**
 * A conversation: messages in speech bubbles, grouped by author with one tail per group, a
 * date line between days and a "New messages" line, attachments and reactions on the bubbles,
 * and a composer. Scrolls with message-scroller: it opens at the latest message, follows new
 * ones while the reader is at the end, and leaves a reader who scrolled up where they are, with
 * a button to jump back. Each message from someone else is announced once ("Hana: See you").
 * Controlled: `messages` in, `onSend` out; `useChatThread` keeps them for an app with no store.
 * Composes message-scroller, message, bubble, marker, attachment, avatar, input-group and empty,
 * and draws nothing of its own.
 */
export function ChatThread(props: ChatThreadProps) {
  return (
    // Follows the end while the reader is there; a reader who scrolled up is left alone.
    <MessageScrollerProvider autoScroll>
      <ChatThreadBody {...props} />
    </MessageScrollerProvider>
  );
}
