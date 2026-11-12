/**
 * The Create page's short code: a whole configuration in a few URL-safe characters. `encode`
 * writes the canonical code; `decode` reads any code and returns a configuration or a reason,
 * never throws, and builds the configuration only from numbers on the ranges' steps and names
 * looked up in fixed lists, so nothing from the URL reaches CSS or a command as text.
 *
 * Alphabet: base 62, `0-9 A-Z a-z` (digit values 0–61 in that order). A number written over
 * several characters is most significant first.
 *
 * ## Version 1 (`1…`). Published: never change what any part of this table means.
 *
 * | Part        | Chars   | Meaning                                                                 |
 * |-------------|---------|-------------------------------------------------------------------------|
 * | version     | 1       | `1`                                                                     |
 * | sections    | 1       | bitmask 0–31 of the sections that follow: 1 look, 2 pen, 4 screentone,  |
 * |             |         | 8 fonts, 16 kit. Encode writes a section only when it differs from      |
 * |             |         | `DEFAULT_CONFIG`; an absent section is the default. 32–61: invalid.     |
 * | look        | 1 or 7  | c 0–3: `LOOK_PRESETS[c]` (default, sepia, weekly, blueline).            |
 * |             |         | c 4–61: custom, N = (c − 4)·62⁶ + the next 6 chars, N in mixed radix,   |
 * |             |         | most significant first: paper hue (360), paper strength (11), ink hue   |
 * |             |         | (360), ink strength (11), spot hue (360), spot vividness (11).          |
 * | pen         | 1 or 6  | c 0–2: `PEN_NAMES[c]` (fine, default, brush). c 3–61: custom,           |
 * |             |         | N = (c − 3)·62⁵ + the next 5 chars, as indexes into `PEN_RANGES` in     |
 * |             |         | `PEN_TOKENS` order (radices 36, 56, 31, 31, 41, 17).                    |
 * | screentone  | 2       | N < 2387: indexes into `SCREENTONE_RANGES` in `SCREENTONE_TOKENS` order |
 * |             |         | (radices 11, 31, 7); the dot must fit its pitch (`screentoneProblem`).  |
 * | fonts       | 2       | N = display slot · 8 + dialogue slot, N < 64, each slot a font of       |
 * |             |         | `DISPLAY_FONT_SLOTS` / `DIALOGUE_FONT_SLOTS` (an empty slot: invalid).  |
 * | kit         | 1, 2+2n | c 0–4: `KIT_NAMES[c]`. c 5: a custom list, then 1 char n (0–61) and n   |
 * |             | or 18   | 2-char indexes into `KIT_CATALOG_V1`, strictly increasing. c 6: a       |
 * |             |         | custom set, then 17 chars N < 2¹⁰⁰, bit i set = `KIT_CATALOG_V1[i]`.    |
 * |             |         | Encode writes the shorter form (the list up to 8 items). c 7–61: invalid.|
 *
 * Nothing may follow the last section. Lengths: the default is `10`, a shipped look `11` plus its
 * digit (`111` sepia), and the longest configuration with a named kit 20 characters
 * (`CODE_LENGTH.longestNamedKit`). A custom kit can hold any subset of the 100 names of
 * `KIT_CATALOG_V1`, at most 18 characters for the kit (37 for the whole code).
 *
 * ## Adding a version
 *
 * Write `decodeV2` beside `decodeV1`, register it under its own version character in
 * `CODE_VERSIONS`, and point `encode` at the new layout. Never edit `decodeV1` or the lists and
 * ranges it reads (`./config.ts`, `./kits.ts`): a version 1 code must keep its meaning.
 */

import {
  type CreateConfig,
  type CustomLook,
  DEFAULT_CONFIG,
  DIALOGUE_FONT_SLOTS,
  DISPLAY_FONT_SLOTS,
  FONT_SLOTS,
  HUE_RANGE,
  KIT_NAMES,
  type Kit,
  LOOK_PRESETS,
  type Look,
  PEN_NAMES,
  PEN_RANGES,
  PEN_TOKENS,
  PENS,
  type Pen,
  penName,
  type Range,
  rangeIndex,
  rangeSize,
  rangeValue,
  SCREENTONE_RANGES,
  SCREENTONE_TOKENS,
  type Screentone,
  STRENGTH_RANGE,
  screentoneProblem,
  VIVIDNESS_RANGE,
} from "./config";
import { KIT_CATALOG_V1 } from "./kits";

export const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = ALPHABET.length;

/** The longest string `decode` looks at; anything longer is rejected before parsing. */
export const MAX_CODE_LENGTH = 160;

/** The version `encode` writes. */
export const CURRENT_VERSION = "1";

export type DecodeResult = { ok: true; config: CreateConfig } | { ok: false; reason: string };

// ── Digits ──────────────────────────────────────────────────────────────────────────────────

function digits(value: number, width: number): string {
  let out = "";
  let rest = value;
  for (let i = 0; i < width; i++) {
    out = ALPHABET[rest % BASE] + out;
    rest = Math.floor(rest / BASE);
  }
  if (rest !== 0) throw new RangeError(`${value} does not fit in ${width} base-62 digits`);
  return out;
}

const digitValue = (char: string) => ALPHABET.indexOf(char);

/** A mixed-radix number from indexes, most significant first. */
function pack(indexes: readonly number[], radices: readonly number[]): number {
  return indexes.reduce((n, index, i) => n * radices[i] + index, 0);
}

function unpack(n: number, radices: readonly number[]): number[] {
  const out: number[] = [];
  let rest = n;
  for (let i = radices.length - 1; i >= 0; i--) {
    out.unshift(rest % radices[i]);
    rest = Math.floor(rest / radices[i]);
  }
  return out;
}

const product = (radices: readonly number[]) => radices.reduce((a, b) => a * b, 1);

// ── Version 1 sections ──────────────────────────────────────────────────────────────────────

const SECTION = { look: 1, pen: 2, screentone: 4, fonts: 8, kit: 16 } as const;
const SECTION_MASK = 31;

const LOOK_RANGES: readonly Range[] = [
  HUE_RANGE,
  STRENGTH_RANGE,
  HUE_RANGE,
  STRENGTH_RANGE,
  HUE_RANGE,
  VIVIDNESS_RANGE,
];
const LOOK_RADICES = LOOK_RANGES.map(rangeSize);
const LOOK_SHORTS = LOOK_PRESETS.length; // 4
const LOOK_TAIL = 6;

const PEN_RADICES = PEN_TOKENS.map((t) => rangeSize(PEN_RANGES[t]));
const PEN_SHORTS = PEN_NAMES.length; // 3
const PEN_TAIL = 5;

const TONE_RADICES = SCREENTONE_TOKENS.map((t) => rangeSize(SCREENTONE_RANGES[t]));
const TONE_WIDTH = 2;
const FONT_WIDTH = 2;

const KIT_LIST = KIT_NAMES.length; // 5
const KIT_SET = KIT_LIST + 1; // 6
const KIT_INDEX_WIDTH = 2;
/** Base-62 digits that hold one bit per name of `KIT_CATALOG_V1`. */
const KIT_SET_WIDTH = Math.ceil((KIT_CATALOG_V1.length * Math.log(2)) / Math.log(BASE));

/** Code lengths of version 1, for the docs and the tests. */
export const CODE_LENGTH = {
  default: 2,
  shippedLook: 3,
  /** Custom look, custom pen, screentone, fonts and a named kit. */
  longestNamedKit: 2 + (1 + LOOK_TAIL) + (1 + PEN_TAIL) + TONE_WIDTH + FONT_WIDTH + 1,
  /** The same with a custom kit in its set form, which holds any subset of the catalog. */
  longest: 2 + (1 + LOOK_TAIL) + (1 + PEN_TAIL) + TONE_WIDTH + FONT_WIDTH + 1 + KIT_SET_WIDTH,
} as const;

/**
 * The long form of a section whose lead digits 0 to `shorts − 1` are names: the lead digit is
 * `shorts` plus the number's top digit, then `tail` more digits.
 */
function long(n: number, shorts: number, tail: number): string {
  const lead = Math.floor(n / BASE ** tail);
  return ALPHABET[shorts + lead] + digits(n % BASE ** tail, tail);
}

// ── Validation ──────────────────────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function valuesProblem(
  values: unknown,
  tokens: readonly string[],
  ranges: Record<string, Range>,
  what: string,
): string | null {
  if (!isRecord(values)) return `${what} is not an object`;
  for (const token of tokens) {
    if (rangeIndex(ranges[token], values[token] as number) < 0) {
      const { min, max, step } = ranges[token];
      return `${what} ${token} must be ${min}–${max} in steps of ${step}`;
    }
  }
  return null;
}

function lookProblem(look: unknown): string | null {
  if (!isRecord(look)) return "look is not an object";
  if ("preset" in look) {
    return (LOOK_PRESETS as readonly unknown[]).includes(look.preset)
      ? null
      : `look preset must be one of ${LOOK_PRESETS.join(", ")}`;
  }
  const custom = look.custom;
  if (!isRecord(custom)) return "look must have a preset or a custom look";
  const fields: [string, string, Range][] = [
    ["paper", "hue", HUE_RANGE],
    ["paper", "strength", STRENGTH_RANGE],
    ["ink", "hue", HUE_RANGE],
    ["ink", "strength", STRENGTH_RANGE],
    ["spot", "hue", HUE_RANGE],
    ["spot", "vividness", VIVIDNESS_RANGE],
  ];
  for (const [part, field, range] of fields) {
    const group = custom[part];
    const value = isRecord(group) ? group[field] : undefined;
    if (rangeIndex(range, value as number) < 0) {
      return `custom ${part} ${field} must be ${range.min}–${range.max} in steps of ${range.step}`;
    }
  }
  return null;
}

function kitProblem(kit: unknown): string | null {
  if (!isRecord(kit)) return "kit is not an object";
  if ("preset" in kit) {
    return (KIT_NAMES as readonly unknown[]).includes(kit.preset)
      ? null
      : `kit must be one of ${KIT_NAMES.join(", ")}`;
  }
  if (!Array.isArray(kit.custom)) return "kit must have a preset or a custom list";
  const seen = new Set<unknown>();
  for (const name of kit.custom) {
    if (!(KIT_CATALOG_V1 as readonly unknown[]).includes(name)) {
      return `custom kit item ${JSON.stringify(name)} is not in the catalog`;
    }
    if (seen.has(name)) return `custom kit lists ${name} twice`;
    seen.add(name);
  }
  return null;
}

/** Why a value is not a configuration the code can carry, or null when it is one. */
export function configProblem(config: unknown): string | null {
  if (!isRecord(config)) return "the configuration is not an object";
  const fonts = config.fonts;
  return (
    lookProblem(config.look) ??
    valuesProblem(config.pen, PEN_TOKENS, PEN_RANGES, "pen") ??
    valuesProblem(config.screentone, SCREENTONE_TOKENS, SCREENTONE_RANGES, "screentone") ??
    screentoneProblem(config.screentone as Screentone) ??
    (isRecord(fonts) &&
    typeof fonts.display === "string" &&
    typeof fonts.dialogue === "string" &&
    (DISPLAY_FONT_SLOTS as readonly unknown[]).includes(fonts.display) &&
    (DIALOGUE_FONT_SLOTS as readonly unknown[]).includes(fonts.dialogue)
      ? null
      : "fonts must name a display and a dialogue font of the list") ??
    kitProblem(config.kit)
  );
}

// ── Encode ──────────────────────────────────────────────────────────────────────────────────

const isDefaultLook = (look: Look) => "preset" in look && look.preset === "default";
const isDefaultKit = (kit: Kit) => "preset" in kit && kit.preset === "basics";
const sameValues = (
  a: Record<string, number>,
  b: Record<string, number>,
  keys: readonly string[],
) => keys.every((key) => a[key] === b[key]);

function encodeLook(look: Look): string {
  if ("preset" in look) return ALPHABET[LOOK_PRESETS.indexOf(look.preset)];
  const { paper, ink, spot }: CustomLook = look.custom;
  const values = [paper.hue, paper.strength, ink.hue, ink.strength, spot.hue, spot.vividness];
  const n = pack(
    values.map((value, i) => rangeIndex(LOOK_RANGES[i], value)),
    LOOK_RADICES,
  );
  return long(n, LOOK_SHORTS, LOOK_TAIL);
}

function encodePen(pen: Pen): string {
  const name = penName(pen);
  if (name) return ALPHABET[PEN_NAMES.indexOf(name)];
  const n = pack(
    PEN_TOKENS.map((t) => rangeIndex(PEN_RANGES[t], pen[t])),
    PEN_RADICES,
  );
  return long(n, PEN_SHORTS, PEN_TAIL);
}

function encodeKit(kit: Kit): string {
  if ("preset" in kit) return ALPHABET[KIT_NAMES.indexOf(kit.preset)];
  const indexes = [...new Set(kit.custom)]
    .map((name) => (KIT_CATALOG_V1 as readonly string[]).indexOf(name))
    .sort((a, b) => a - b);
  // The list form is 2 + 2n characters, the set form 1 + 17: the list wins up to 8 items.
  if (2 + indexes.length * KIT_INDEX_WIDTH <= 1 + KIT_SET_WIDTH) {
    const list = indexes.map((i) => digits(i, KIT_INDEX_WIDTH)).join("");
    return ALPHABET[KIT_LIST] + digits(indexes.length, 1) + list;
  }
  let n = BigInt(0);
  for (const i of indexes) n |= BigInt(1) << BigInt(i);
  let set = "";
  for (let i = 0; i < KIT_SET_WIDTH; i++) {
    set = ALPHABET[Number(n % BigInt(BASE))] + set;
    n /= BigInt(BASE);
  }
  return ALPHABET[KIT_SET] + set;
}

/**
 * The canonical code of a configuration. Throws a RangeError when `config` is not one the code
 * can carry (`configProblem`): a programming error, since the page offers only valid choices.
 */
export function encode(config: CreateConfig): string {
  const problem = configProblem(config);
  if (problem) throw new RangeError(`Cannot encode: ${problem}`);
  let mask = 0;
  let body = "";
  if (!isDefaultLook(config.look)) {
    mask |= SECTION.look;
    body += encodeLook(config.look);
  }
  if (!sameValues(config.pen, DEFAULT_CONFIG.pen, PEN_TOKENS)) {
    mask |= SECTION.pen;
    body += encodePen(config.pen);
  }
  if (!sameValues(config.screentone, DEFAULT_CONFIG.screentone, SCREENTONE_TOKENS)) {
    mask |= SECTION.screentone;
    const indexes = SCREENTONE_TOKENS.map((t) =>
      rangeIndex(SCREENTONE_RANGES[t], config.screentone[t]),
    );
    body += digits(pack(indexes, TONE_RADICES), TONE_WIDTH);
  }
  const { display, dialogue } = config.fonts;
  if (display !== DEFAULT_CONFIG.fonts.display || dialogue !== DEFAULT_CONFIG.fonts.dialogue) {
    mask |= SECTION.fonts;
    const d = (DISPLAY_FONT_SLOTS as readonly unknown[]).indexOf(display);
    const t = (DIALOGUE_FONT_SLOTS as readonly unknown[]).indexOf(dialogue);
    body += digits(d * FONT_SLOTS + t, FONT_WIDTH);
  }
  if (!isDefaultKit(config.kit)) {
    mask |= SECTION.kit;
    body += encodeKit(config.kit);
  }
  return CURRENT_VERSION + ALPHABET[mask] + body;
}

// ── Decode ──────────────────────────────────────────────────────────────────────────────────

/** Reads base-62 digits from a code that is already known to hold only the alphabet. */
class Reader {
  private at = 0;
  constructor(private readonly text: string) {}
  get rest(): number {
    return this.text.length - this.at;
  }
  /** The next `width` characters as a number, or -1 when the code ends first. */
  number(width: number): number {
    if (this.rest < width) return -1;
    let n = 0;
    for (let i = 0; i < width; i++) n = n * BASE + digitValue(this.text[this.at++]);
    return n;
  }
  /** The next `width` characters as a BigInt, or null when the code ends first. */
  big(width: number): bigint | null {
    if (this.rest < width) return null;
    let n = BigInt(0);
    for (let i = 0; i < width; i++) {
      n = n * BigInt(BASE) + BigInt(digitValue(this.text[this.at++]));
    }
    return n;
  }
}

class Invalid extends Error {}
const fail = (reason: string): never => {
  throw new Invalid(reason);
};

function need(n: number, what: string): number {
  return n < 0 ? fail(`the code ends inside the ${what}`) : n;
}

function readLook(reader: Reader): Look {
  const lead = need(reader.number(1), "look");
  if (lead < LOOK_SHORTS) return { preset: LOOK_PRESETS[lead] };
  const n = (lead - LOOK_SHORTS) * BASE ** LOOK_TAIL + need(reader.number(LOOK_TAIL), "look");
  if (n >= product(LOOK_RADICES)) fail("the custom look is out of range");
  const v = unpack(n, LOOK_RADICES).map((i, k) => rangeValue(LOOK_RANGES[k], i));
  return {
    custom: {
      paper: { hue: v[0], strength: v[1] },
      ink: { hue: v[2], strength: v[3] },
      spot: { hue: v[4], vividness: v[5] },
    },
  };
}

function readPen(reader: Reader): Pen {
  const lead = need(reader.number(1), "pen");
  if (lead < PEN_SHORTS) return { ...PENS[PEN_NAMES[lead]] };
  const n = (lead - PEN_SHORTS) * BASE ** PEN_TAIL + need(reader.number(PEN_TAIL), "pen");
  if (n >= product(PEN_RADICES)) fail("the pen is out of range");
  const indexes = unpack(n, PEN_RADICES);
  return Object.fromEntries(
    PEN_TOKENS.map((t, i) => [t, rangeValue(PEN_RANGES[t], indexes[i])]),
  ) as Pen;
}

function readScreentone(reader: Reader): Screentone {
  const n = need(reader.number(TONE_WIDTH), "screentone");
  if (n >= product(TONE_RADICES)) fail("the screentone is out of range");
  const indexes = unpack(n, TONE_RADICES);
  const tone = Object.fromEntries(
    SCREENTONE_TOKENS.map((t, i) => [t, rangeValue(SCREENTONE_RANGES[t], indexes[i])]),
  ) as Screentone;
  const problem = screentoneProblem(tone);
  return problem ? fail(problem) : tone;
}

function readFonts(reader: Reader): CreateConfig["fonts"] {
  const n = need(reader.number(FONT_WIDTH), "fonts");
  if (n >= FONT_SLOTS * FONT_SLOTS) fail("the fonts are out of range");
  const display = DISPLAY_FONT_SLOTS[Math.floor(n / FONT_SLOTS)];
  const dialogue = DIALOGUE_FONT_SLOTS[n % FONT_SLOTS];
  if (display === null) fail(`display font slot ${Math.floor(n / FONT_SLOTS)} holds no font`);
  if (dialogue === null) fail(`dialogue font slot ${n % FONT_SLOTS} holds no font`);
  return {
    display: display as NonNullable<typeof display>,
    dialogue: dialogue as NonNullable<typeof dialogue>,
  };
}

function readKit(reader: Reader): Kit {
  const lead = need(reader.number(1), "kit");
  if (lead < KIT_NAMES.length) return { preset: KIT_NAMES[lead] };
  const custom: string[] = [];
  if (lead === KIT_LIST) {
    const count = need(reader.number(1), "kit");
    let previous = -1;
    for (let k = 0; k < count; k++) {
      const index = need(reader.number(KIT_INDEX_WIDTH), "kit");
      if (index >= KIT_CATALOG_V1.length) fail(`kit item ${index} is not in the catalog`);
      if (index <= previous) fail("the kit's items are not in increasing order");
      custom.push(KIT_CATALOG_V1[index]);
      previous = index;
    }
    return { custom };
  }
  if (lead === KIT_SET) {
    const n = reader.big(KIT_SET_WIDTH);
    if (n === null) return fail("the code ends inside the kit");
    if (n >> BigInt(KIT_CATALOG_V1.length) !== BigInt(0))
      fail("the kit names items not in the catalog");
    KIT_CATALOG_V1.forEach((name, i) => {
      if ((n >> BigInt(i)) & BigInt(1)) custom.push(name);
    });
    return { custom };
  }
  return fail(`kit form ${lead} is not defined`);
}

/** Version 1: the part of the code after the version character. */
function decodeV1(body: string): DecodeResult {
  try {
    const reader = new Reader(body);
    const mask = need(reader.number(1), "sections");
    if (mask > SECTION_MASK) fail(`section mask ${mask} is not defined`);
    const config: CreateConfig = {
      look: mask & SECTION.look ? readLook(reader) : DEFAULT_CONFIG.look,
      pen: mask & SECTION.pen ? readPen(reader) : { ...DEFAULT_CONFIG.pen },
      screentone:
        mask & SECTION.screentone ? readScreentone(reader) : { ...DEFAULT_CONFIG.screentone },
      fonts: mask & SECTION.fonts ? readFonts(reader) : { ...DEFAULT_CONFIG.fonts },
      kit: mask & SECTION.kit ? readKit(reader) : DEFAULT_CONFIG.kit,
    };
    if (reader.rest > 0) fail(`${reader.rest} character(s) follow the last section`);
    // Belt and braces: whatever was read must be a configuration the code could have written.
    const problem = configProblem(config);
    return problem ? { ok: false, reason: problem } : { ok: true, config: structuredClone(config) };
  } catch (error) {
    if (error instanceof Invalid) return { ok: false, reason: error.message };
    return { ok: false, reason: "the code could not be read" };
  }
}

export type VersionDecoder = (body: string) => DecodeResult;

/** Every published version, by its character. Append only. */
export const CODE_VERSIONS: Readonly<Record<string, VersionDecoder>> = { "1": decodeV1 };

const CODE_PATTERN = /^[0-9A-Za-z]+$/;

/** `decode` against a given table of versions (the tests pass an old-version stub). */
export function decodeWith(
  code: unknown,
  versions: Readonly<Record<string, VersionDecoder>>,
): DecodeResult {
  if (typeof code !== "string") return { ok: false, reason: "no code" };
  if (code.length === 0) return { ok: false, reason: "the code is empty" };
  if (code.length > MAX_CODE_LENGTH) {
    return { ok: false, reason: `the code is longer than ${MAX_CODE_LENGTH} characters` };
  }
  if (!CODE_PATTERN.test(code))
    return { ok: false, reason: "the code has a character outside 0-9, A-Z, a-z" };
  const version = code[0];
  if (!Object.hasOwn(versions, version)) {
    return { ok: false, reason: `code version ${version} is not known` };
  }
  return versions[version](code.slice(1));
}

/** A configuration from a code, or why the code is not one. Never throws. */
export function decode(code: unknown): DecodeResult {
  return decodeWith(code, CODE_VERSIONS);
}

/** What the page shows for a code: its configuration, or the default and the reason. */
export function decodeOrDefault(code: unknown): { config: CreateConfig; reason: string | null } {
  const result = decode(code);
  return result.ok
    ? { config: result.config, reason: null }
    : { config: structuredClone(DEFAULT_CONFIG), reason: result.reason };
}
