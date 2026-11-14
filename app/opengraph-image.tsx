import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

// The share card for every page (link previews in chats, social posts and some AI answers):
// the horizontal logo on paper, the pitch in ink, a spot-red rule. Built once at build time.
export const alt = "mangacn: manga-styled React components for shadcn/ui";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0f0d0b";
const PAPER = "#fdfaf4";
const SPOT = "#db1c22";

export default function OpengraphImage() {
  // Read synchronously: an awaited read counts as uncached I/O and would render per request.
  const logo = readFileSync(path.join(process.cwd(), "brand/logo/mangacn-horizontal.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: PAPER,
        color: INK,
        border: `16px solid ${INK}`,
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: next/og renders plain img tags only. */}
      <img src={logoSrc} alt="" width={640} height={143} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ width: 160, height: 12, background: SPOT }} />
        <div style={{ fontSize: 60, lineHeight: 1.1, letterSpacing: -1 }}>
          Manga-styled React components for shadcn/ui
        </div>
        <div style={{ fontSize: 32, opacity: 0.75 }}>
          Speech bubbles · screentone · ink panels · SFX · blocks
        </div>
      </div>
    </div>,
    size,
  );
}
