/** @vitest-environment node */
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { ALPHABET, MAX_CODE_LENGTH } from "@/lib/create/code";
import { FAILURE_HEADERS, SUCCESS_HEADERS, UNKNOWN_FONT_MESSAGE } from "@/lib/create/serve";
import { REGISTRY_CACHE_CONTROL } from "@/lib/registry/headers";
import { GET as getBundle } from "./[code]/route";
import { GET as getTheme } from "./[code]/theme.json/route";
import { GET as getVite } from "./[code]/vite.json/route";
import { GET as getFont } from "./font/[role]/[id]/route";

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

// ── The Vite bundle and the font items (Task C7) ────────────────────────────────────────────

describe("GET /r/create/<code>/vite.json", () => {
  it("answers the Vite bundle: the bundle's preset, theme and kit, and a body font", async () => {
    const url = "https://www.mangacn.com/r/create/10/vite.json";
    const ctx = { params: Promise.resolve({ code: "10" }) };
    const response = await getVite(new NextRequest(url), ctx as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(REGISTRY_CACHE_CONTROL);
    const body = await response.json();
    const bundle = await (await call("bundle", "10.json")).json();
    expect(body.name).toBe("create-10-vite");
    expect(body.registryDependencies).toEqual(bundle.registryDependencies);
    expect(Object.keys(body.cssVars.theme)).toEqual(["font-sans"]);
    const bad = await getVite(new NextRequest("https://www.mangacn.com/r/create/Z0/vite.json"), {
      params: Promise.resolve({ code: "Z0" }),
    } as never);
    expect(bad.status).toBe(404);
  });
});

describe("GET /r/create/font/<role>/<id>.json", () => {
  const getFontAt = (role: string, id: string) =>
    getFont(new Request(`https://www.mangacn.com/r/create/font/${role}/${id}`), {
      params: Promise.resolve({ role, id }),
    } as never);

  it("answers a curated face with its registry:font item and the registry's headers", async () => {
    const response = await getFontAt("display", "reggae-one.json");
    expect(response.status).toBe(200);
    expect(headersOf(response)).toEqual({
      "access-control-allow-methods": "GET",
      "access-control-allow-origin": "*",
      "cache-control": REGISTRY_CACHE_CONTROL,
      "content-type": "application/json",
    });
    const body = await response.json();
    expect(body.type).toBe("registry:font");
    expect(body.font.import).toBe("Reggae_One");
  });

  it("answers anything else with 404 and a fixed message, never the request", async () => {
    const next = random(777);
    const ids = ["reggae-one", "comic-sans.json", "reggae-one.jsonx", ".json", "", "toString.json"];
    const roles = ["display", "dialogue", "sans", "__proto__", "constructor", ""];
    const asked: [string, string][] = [
      ["dialogue", "reggae-one.json"],
      ["display", "shantell-sans.json"],
      ...ids.flatMap((id) => roles.map((role) => [role, id] as [string, string])),
      ...Array.from(
        { length: 200 },
        () =>
          [
            HOSTILE[Math.floor(next() * HOSTILE.length)],
            `${HOSTILE[Math.floor(next() * HOSTILE.length)]}.json`,
          ] as [string, string],
      ),
    ];
    for (const [role, id] of asked) {
      const response = await getFontAt(role, id);
      if (role === "display" && id === "reggae-one.json") continue;
      expect(response.status, `${role}/${id}`).toBe(404);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({ message: UNKNOWN_FONT_MESSAGE });
    }
  });
});
