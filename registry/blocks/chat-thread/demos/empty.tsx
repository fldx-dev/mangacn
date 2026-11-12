"use client";

import { ChatThread, useChatThread } from "@/registry/blocks/chat-thread/chat-thread";

export default function ChatThreadEmptyDemo() {
  // A new thread: `me` is an author here, since no message names them yet.
  const thread = useChatThread({ me: { id: "ren", name: "Ren" } });
  return (
    <ChatThread
      messages={thread.messages}
      me={thread.me}
      onSend={thread.send}
      placeholder="Write to Hana…"
      label="Chat with Hana Mori"
      className="h-80 max-w-md"
    />
  );
}
