/** @vitest-environment node */
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { ALPHABET, MAX_CODE_LENGTH } from "@/lib/create/code";
import { FAILURE_HEADERS, SUCCESS_HEADERS } from "@/lib/create/serve";
import { REGISTRY_CACHE_CONTROL } from "@/lib/registry/headers";
import { GET as getBundle } from "./[code]/route";
import { GET as getTheme } from "./[code]/theme.json/route";

type Kind = "bundle" | "theme";

/** What the router hands each route: the request and the dynamic segment. */
function call(kind: Kind, segment: string): Promise<Response> {
  const url =
    kind === "bundle"
      ? `https://www.mangacn.com/r/create/${encodeURIComponent(segment)}`
      : `https://www.mangacn.com/r/create/${encodeURIComponent(segment)}/theme.json`;
  const ctx = { params: Promise.resolve({ code: segment }) };
  return kind === "bundle"
    ? getBundle(new NextRequest(url), ctx as never)
    : getTheme(new NextRequest(url), ctx as never);
}

const headersOf = (response: Response) => Object.fromEntries(response.headers.entries());

describe("GET /r/create/<code>.json and /r/create/<code>/theme.json", () => {
  it("answer a valid code with the item, JSON and the registry's cache and CORS headers", async () => {
    for (const [kind, segment, type] of [
      ["bundle", "10.json", "registry:base"],
      ["theme", "10", "registry:theme"],
    ] as const) {
      const response = await call(kind, segment);
      expect(response.status).toBe(200);
      expect(headersOf(response)).toEqual({
        "access-control-allow-methods": "GET",
        "access-control-allow-origin": "*",
        "cache-control": REGISTRY_CACHE_CONTROL,
        "content-type": "application/json",
      });
      const body = await response.json();
      expect(body.type).toBe(type);
      expect(body.name).toBe(kind === "bundle" ? "create-10" : "create-10-theme");
    }
    expect(SUCCESS_HEADERS["Cache-Control"]).toBe(REGISTRY_CACHE_CONTROL);
  });

  it("answer the same code with the same bytes every time (the CLI fetches it twice)", async () => {
    const a = await (await call("bundle", "1Hk.json")).text();
    const b = await (await call("bundle", "1Hk.json")).text();
    expect(a).toBe(b);
  });

  it("put the production origin into the items outside development", async () => {
    const body = await (await call("bundle", "10.json")).json();
    expect(body.registryDependencies[0]).toBe("https://www.mangacn.com/r/create/10/theme.json");
  });

  const BAD: [string, Kind, string, string][] = [
    ["empty", "bundle", ".json", "the code is empty"],
    ["empty", "theme", "", "the code is empty"],
    ["no .json", "bundle", "10", "the address must end in .json"],
    [
      "too long",
      "bundle",
      `1${"0".repeat(MAX_CODE_LENGTH)}.json`,
      `the code is longer than ${MAX_CODE_LENGTH} characters`,
    ],
    ["bad alphabet", "theme", "1-0", "the code has a character outside 0-9, A-Z, a-z"],
    ["unknown version", "bundle", "Z0.json", "code version Z is not known"],
    ["section mask out of range", "theme", `1${ALPHABET[40]}`, "section mask 40 is not defined"],
    ["fonts out of range", "bundle", "18zz.json", "the fonts are out of range"],
    ["trailing characters", "theme", "100", "1 character(s) follow the last section"],
  ];

  it.each(BAD)(
    "%s (%s %j): 404 with a message a person can act on",
    async (_, kind, segment, reason) => {
      const response = await call(kind, segment);
      expect(response.status).toBe(404);
      expect(headersOf(response)).toEqual({
        "access-control-allow-methods": "GET",
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
        "content-type": "application/json",
      });
      expect(await response.json()).toEqual({
        message: `This Create code is not valid: ${reason}. Make one at https://www.mangacn.com/create.`,
      });
      expect(FAILURE_HEADERS["Cache-Control"]).toBe("no-store");
    },
  );
});

// ── Fuzz: hostile path segments ─────────────────────────────────────────────────────────────

function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Each holds a character outside the code alphabet, so no segment built with one is a code. */
const HOSTILE = [
  '"',
  "'",
  "`",
  "{",
  "}",
  "</script>",
  "<script>alert(1)</script>",
  ";",
  "url(",
  "url(https://evil.example/x)",
  ") } body { color: red",
  "\\",
  "/",
  "..",
  "%00",
  "\u0000",
  "\n",
  " ",
  "$",
  "${",
  "process.env}",
  "__proto__",
  "constructor.json",
  "漫画",
  "😀",
  "é",
  "‮",
  "--paper",
  "*/",
  "@import",
  "-",
  ".",
];

function hostileSegment(next: () => number): string {
  const pick = <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)];
  const alnum = (n: number) =>
    Array.from({ length: n }, () => ALPHABET[Math.floor(next() * ALPHABET.length)]).join("");
  const roll = next();
  if (roll < 0.1) return `1${alnum(MAX_CODE_LENGTH + Math.floor(next() * 5000))}`;
  const parts = [next() < 0.5 ? "10" : alnum(Math.floor(next() * 12))];
  const count = 1 + Math.floor(next() * 4);
  for (let i = 0; i < count; i++) parts.push(pick(HOSTILE), alnum(Math.floor(next() * 4)));
  return parts.join("");
}

describe("fuzz: hostile path segments", () => {
  it("3000 hostile segments never yield a 200, and the message never echoes them", async () => {
    const next = random(424242);
    const found: string[] = [];
    for (let i = 0; i < 3000; i++) {
      const segment = hostileSegment(next);
      const kind: Kind = next() < 0.5 ? "bundle" : "theme";
      const asked = kind === "bundle" && next() < 0.8 ? `${segment}.json` : segment;
      const response = await call(kind, asked);
      const text = await response.text();
      const body = JSON.parse(text) as { message?: string };
      const keys = Object.keys(body);
      if (response.status !== 404) found.push(`${JSON.stringify(asked)}: ${response.status}`);
      if (keys.length !== 1 || keys[0] !== "message")
        found.push(`${JSON.stringify(asked)}: ${text}`);
      if (/stack|Error:|\n\s+at /.test(text)) found.push(`${JSON.stringify(asked)}: a stack`);
      if (
        !/^This Create code is not valid: [\w ,.()-]+\. Make one at https:\/\/www\.mangacn\.com\/create\.$/.test(
          body.message ?? "",
        )
      ) {
        found.push(`${JSON.stringify(asked)}: message ${JSON.stringify(body.message)}`);
      }
    }
    expect(found.slice(0, 20)).toEqual([]);
  }, 120_000);
});
