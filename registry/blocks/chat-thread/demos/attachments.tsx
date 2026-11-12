import { type ChatMessage, ChatThread } from "@/registry/blocks/chat-thread/chat-thread";

const studio = { id: "studio", name: "Studio Kumo" };
const ren = { id: "ren", name: "Ren" };

// Any image URL works as a thumbnail; this one (a panel with a figure on screentone) is an
// inline SVG, so the demo loads no network image.
const panel = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><pattern id="t" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.9" fill="#9a9a9a"/></pattern></defs>
<rect width="64" height="64" fill="#f4f1ea"/>
<rect width="64" height="40" fill="url(#t)"/>
<path d="M0 40h64" stroke="#222" stroke-width="2"/>
<path d="M22 64l4-22h12l4 22z" fill="#222"/>
<circle cx="32" cy="34" r="7" fill="#f4f1ea" stroke="#222" stroke-width="2"/>
</svg>`;
const thumbnail = `data:image/svg+xml,${encodeURIComponent(panel)}`;

const messages: ChatMessage[] = [
  {
    id: "a1",
    author: ren,
    text: "Pages 1 to 4, and the script with my notes.",
    at: "2026-11-12T09:40:00+09:00",
    attachments: [
      { id: "f1", name: "page-01.png", type: "image/png", size: 1_120_000, thumbnail },
      { id: "f2", name: "script-notes.pdf", type: "application/pdf", size: 380_000 },
    ],
  },
  {
    id: "a2",
    author: studio,
    text: "Got them, thanks.",
    at: "2026-11-12T09:52:00+09:00",
  },
  {
    id: "a3",
    author: studio,
    text: "Lettering proofs for the same pages.",
    at: "2026-11-12T11:05:00+09:00",
    attachments: [
      { id: "f3", name: "letters-01-04.pdf", type: "application/pdf", size: 2_400_000 },
    ],
  },
  {
    id: "a4",
    author: studio,
    text: "",
    at: "2026-11-12T11:06:00+09:00",
    attachments: [{ id: "f4", name: "sfx-sheet.png", type: "image/png", size: 640_000, thumbnail }],
    reactions: [{ emoji: "🔥", count: 3 }],
  },
];

export default function ChatThreadAttachmentsDemo() {
  // No onSend: a thread that is only read has no composer. The last two messages are unread.
  return (
    <ChatThread
      messages={messages}
      me="ren"
      unreadFrom="a3"
      label="Files from Studio Kumo"
      className="h-[30rem] max-w-md"
    />
  );
}
