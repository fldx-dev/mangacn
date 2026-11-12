"use client";

import {
  type ChatMessage,
  ChatThread,
  useChatThread,
} from "@/registry/blocks/chat-thread/chat-thread";

const hana = { id: "hana", name: "Hana Mori" };
const ren = { id: "ren", name: "Ren" };

// Two days of an artist and her editor. Times are written in Tokyo's offset and shown as written.
const initial: ChatMessage[] = [
  {
    id: "m1",
    author: hana,
    text: "The editor read the draft of chapter 12.",
    at: "2026-11-11T20:58:00+09:00",
  },
  {
    id: "m2",
    author: hana,
    text: "She wants the rooftop fight two pages longer.",
    at: "2026-11-11T20:59:00+09:00",
    reactions: [{ emoji: "😱", count: 1 }],
  },
  {
    id: "m3",
    author: ren,
    text: "Two more pages of rain and speed lines, then.",
    at: "2026-11-11T21:03:00+09:00",
  },
  {
    id: "m4",
    author: ren,
    text: "Thumbnails tonight, pencils by Friday.",
    at: "2026-11-11T21:04:00+09:00",
    reactions: [{ emoji: "👍", count: 2 }],
  },
  {
    id: "m5",
    author: hana,
    text: "Thumbnails look great.\nKeep the splash on page 14.",
    at: "2026-11-12T08:15:00+09:00",
  },
  {
    id: "m6",
    author: ren,
    text: "Will do. Inking starts today.",
    at: "2026-11-12T08:21:00+09:00",
  },
];

export default function ChatThreadDefaultDemo() {
  // Keeps the messages in state; your store or server would hold them instead.
  const thread = useChatThread({ initial, me: "ren" });
  return (
    <ChatThread
      messages={thread.messages}
      me={thread.me}
      onSend={thread.send}
      label="Chat with Hana Mori"
      className="h-[30rem] max-w-md"
    />
  );
}
