import { describe, expect, it } from "vitest";
import {
  ALPHABET,
  CODE_LENGTH,
  CODE_VERSIONS,
  configProblem,
  type DecodeResult,
  decode,
  decodeOrDefault,
  decodeWith,
  encode,
  MAX_CODE_LENGTH,
} from "./code";
import {
  type CreateConfig,
  DEFAULT_CONFIG,
  DIALOGUE_FONTS,
  DISPLAY_FONTS,
  HUE_RANGE,
  KIT_NAMES,
  LOOK_PRESETS,
  PEN_NAMES,
  PEN_RANGES,
  PEN_TOKENS,
  PENS,
  type Range,
  SCREENTONE_RANGES,
  SCREENTONE_TOKENS,
  STRENGTH_RANGE,
  VIVIDNESS_RANGE,
} from "./config";
import { KIT_CATALOG_V1 } from "./kits";

const base = (): CreateConfig => structuredClone(DEFAULT_CONFIG);
const MID_LOOK = {
  paper: { hue: 84, strength: 5 },
  ink: { hue: 50, strength: 5 },
  spot: { hue: 37, vividness: 5 },
};

function roundTrip(config: CreateConfig) {
  const code = encode(config);
  const result = decode(code);
  expect(result, code).toEqual({ ok: true, config });
  // The canonical code: encoding what was decoded writes the same code.
  expect(encode((result as { config: CreateConfig }).config)).toBe(code);
  return code;
}

const ends = (range: Range) => [range.min, range.max];

describe("encode / decode: round trips", () => {
  it("the default configuration is `10`", () => {
    expect(roundTrip(base())).toBe("10");
    expect(CODE_LENGTH.default).toBe(2);
  });

  it.each(LOOK_PRESETS.map((preset, i) => [preset, i] as const))(
    "the %s look with defaults elsewhere",
    (preset, i) => {
      const code = roundTrip({ ...base(), look: { preset } });
      expect(code).toBe(i === 0 ? "10" : `11${i}`);
    },
  );

  const lookFields = [
    ["paper", "hue", HUE_RANGE],
    ["paper", "strength", STRENGTH_RANGE],
    ["ink", "hue", HUE_RANGE],
    ["ink", "strength", STRENGTH_RANGE],
    ["spot", "hue", HUE_RANGE],
    ["spot", "vividness", VIVIDNESS_RANGE],
  ] as const;
  it.each(lookFields)(
    "custom look %s %s at its minimum, maximum and a middle value",
    (part, field, range) => {
      for (const value of [...ends(range), Math.round((range.min + range.max) / 2)]) {
        const custom = structuredClone(MID_LOOK);
        (custom[part] as Record<string, number>)[field] = value;
        expect(roundTrip({ ...base(), look: { custom } })).toHaveLength(9);
      }
    },
  );

  it.each(PEN_TOKENS)("pen %s at its minimum, maximum and default", (token) => {
    for (const value of [...ends(PEN_RANGES[token]), DEFAULT_CONFIG.pen[token]]) {
      roundTrip({ ...base(), pen: { ...PENS.default, [token]: value } });
    }
  });

  it.each(PEN_NAMES.map((name, i) => [name, i] as const))(
    "the %s pen is one character",
    (name, i) => {
      const code = roundTrip({ ...base(), pen: { ...PENS[name] } });
      expect(code).toBe(name === "default" ? "10" : `12${i}`);
    },
  );

  it.each(SCREENTONE_TOKENS)("screentone %s at its minimum, maximum and default", (token) => {
    for (const value of [...ends(SCREENTONE_RANGES[token]), DEFAULT_CONFIG.screentone[token]]) {
      const screentone = { ...DEFAULT_CONFIG.screentone, [token]: value };
      // Keep the dot inside the pitch: a 3px pitch takes a dot of at most 1px, a 3.5px dot an 8px pitch.
      if (token === "halftone-size" && value === 3) screentone["halftone-dot"] = 1;
      if (token === "halftone-dot" && value === 3.5) screentone["halftone-size"] = 8;
      roundTrip({ ...base(), screentone });
    }
  });

  it("every font pair", () => {
    for (const display of DISPLAY_FONTS) {
      for (const dialogue of DIALOGUE_FONTS) roundTrip({ ...base(), fonts: { display, dialogue } });
    }
  });

  it("every named kit, and custom kits from empty to the whole catalog", () => {
    for (const preset of KIT_NAMES) roundTrip({ ...base(), kit: { preset } });
    const lengths: number[] = [];
    for (const size of [0, 1, 8, 9, 50, KIT_CATALOG_V1.length]) {
      const step = Math.max(1, Math.floor(KIT_CATALOG_V1.length / Math.max(size, 1)));
      const custom = KIT_CATALOG_V1.filter((_, i) => i % step === 0).slice(0, size);
      expect(custom).toHaveLength(size);
      lengths.push(roundTrip({ ...base(), kit: { custom } }).length);
    }
    // The list form up to 8 items (2 + 2n), the set form after (1 + 17).
    expect(lengths).toEqual([4, 6, 20, 20, 20, 20]);
    expect(roundTrip({ ...base(), kit: { custom: [KIT_CATALOG_V1[99]] } })).toBe("1G511b");
  });

  it("the longest configuration with a named kit is under 24 characters", () => {
    const longest: CreateConfig = {
      look: {
        custom: {
          paper: { hue: 359, strength: 10 },
          ink: { hue: 359, strength: 10 },
          spot: { hue: 359, vividness: 10 },
        },
      },
      pen: Object.fromEntries(PEN_TOKENS.map((t) => [t, PEN_RANGES[t].max])) as CreateConfig["pen"],
      screentone: { "halftone-size": 8, "halftone-dot": 3.5, "speed-line-width": 4 },
      fonts: { display: "reggae-one", dialogue: "patrick-hand-sc" },
      kit: { preset: "series-site" },
    };
    const code = roundTrip(longest);
    expect(code).toHaveLength(CODE_LENGTH.longestNamedKit);
    expect(code.length).toBeLessThan(24);
    const all = roundTrip({ ...longest, kit: { custom: [...KIT_CATALOG_V1] } });
    expect(all).toHaveLength(CODE_LENGTH.longest);
    expect(CODE_LENGTH).toEqual({ default: 2, shippedLook: 3, longestNamedKit: 20, longest: 37 });
  });

  it("writes the canonical form of a code that says the same thing longer", () => {
    // A section that repeats the default, the default pen by name, a short kit in set form.
    const set = (indexes: number[]) => {
      let n = BigInt(0);
      for (const i of indexes) n |= BigInt(1) << BigInt(i);
      let out = "";
      for (let k = 0; k < 17; k++) {
        out = ALPHABET[Number(n % BigInt(62))] + out;
        n /= BigInt(62);
      }
      return `6${out}`;
    };
    const cases: [code: string, canonical: string][] = [
      ["110", "10"], // the look section, naming the default look
      ["121", "10"], // the pen section, naming the default pen
      ["1G0", "10"], // the kit section, naming basics
      ["1300", "120"], // the default look again, then the fine pen
      [`1G${set([9, 13])}`, "1G52090D"], // button and card in set form: the list is shorter
    ];
    for (const [code, canonical] of cases) {
      const result = decode(code);
      expect(result.ok, code).toBe(true);
      expect(encode((result as { config: CreateConfig }).config), code).toBe(canonical);
      expect(decode(canonical)).toEqual(result);
    }
    expect((decode(`1G${set([9, 13])}`) as { config: CreateConfig }).config.kit).toEqual({
      custom: ["button", "card"],
    });
    // A list of nine items is valid too; the set form is canonical from nine.
    const nine = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const list = `1G59${nine.map((i) => `0${ALPHABET[i]}`).join("")}`;
    const fromList = decode(list) as { ok: true; config: CreateConfig };
    expect(fromList.ok).toBe(true);
    expect(encode(fromList.config)).toBe(`1G${set(nine)}`);
  });

  it("orders and dedupes a custom kit when encoding", () => {
    expect(encode({ ...base(), kit: { custom: ["card", "button"] } })).toBe("1G52090D");
  });
});

describe("decode: versions", () => {
  it("dispatches on the version character (an old-version stub beside version 1)", () => {
    const seen: string[] = [];
    const stub = (body: string): DecodeResult => {
      seen.push(body);
      return { ok: true, config: { ...base(), look: { preset: "weekly" } } };
    };
    const versions = { ...CODE_VERSIONS, "0": stub };
    expect(decodeWith("0abc", versions)).toEqual({
      ok: true,
      config: { ...base(), look: { preset: "weekly" } },
    });
    expect(seen).toEqual(["abc"]);
    expect(decodeWith("111", versions)).toEqual({
      ok: true,
      config: { ...base(), look: { preset: "sepia" } },
    });
    // The published table has no version 0.
    expect(decode("0abc")).toEqual({ ok: false, reason: "code version 0 is not known" });
  });
});

describe("decode: hostile input", () => {
  const rejects = (code: unknown, reason?: RegExp) => {
    let result: DecodeResult | undefined;
    expect(() => {
      result = decode(code);
    }).not.toThrow();
    expect(result?.ok, String(code)).toBe(false);
    expect(result).not.toHaveProperty("config");
    if (reason) expect((result as { reason: string }).reason).toMatch(reason);
  };

  it("rejects what is not a code", () => {
    for (const value of [undefined, null, 42, {}, [], ["10"], true]) rejects(value, /no code/);
    rejects("", /empty/);
    rejects(`1${"0".repeat(MAX_CODE_LENGTH)}`, /longer than/);
  });

  it("rejects characters outside the alphabet", () => {
    for (const code of [
      "1-",
      "1 0",
      "10\n",
      "1_0",
      "1é",
      "1%30",
      "1+0",
      "１0",
      "1\u00000",
      "<10>",
    ]) {
      rejects(code, /outside 0-9, A-Z, a-z/);
    }
  });

  it("rejects an unknown version", () => {
    for (const code of ["0", "20", "z10", "A10"]) rejects(code, /version . is not known/);
  });

  it("rejects a code that ends inside a section, or runs past the last", () => {
    for (const code of [
      "1",
      "11",
      "12",
      "14",
      "18",
      "1G",
      "1G5",
      "1G51",
      "1G511",
      "1G6zz",
      "15",
      "13A",
    ]) {
      rejects(code, /ends inside/);
    }
    for (const code of ["100", "1110", "10z"]) rejects(code, /follow the last section/);
  });

  it("rejects every section out of range", () => {
    rejects("1W", /section mask 32/);
    rejects("1z", /section mask 61/);
    rejects("11zzzzzzz", /custom look is out of range/);
    rejects("12zzzzzz", /pen is out of range/);
    rejects("14zz", /screentone is out of range/);
    rejects("18zz", /fonts are out of range/);
    rejects("1G7", /kit form 7/);
    rejects("1Gz", /kit form 61/);
    rejects(`1G6${"z".repeat(17)}`, /not in the catalog/);
  });

  it("rejects a dot too large for its pitch", () => {
    // size index 0 (3px), dot index 30 (3.5px), speed index 2: 0·217 + 30·7 + 2 = 212 = "3Q".
    rejects("143Q", /too large for a 3px pitch/);
  });

  it("rejects a font slot that holds no font yet", () => {
    rejects("180G", /display font slot 2 holds no font/); // 2·8 + 0 = 16
    rejects("1802", /dialogue font slot 2 holds no font/);
    rejects("180z", /display font slot 7/); // 61 = 7·8 + 5
  });

  it("rejects a custom kit naming a missing item, or listing one twice", () => {
    rejects("1G511c", /kit item 100 is not in the catalog/);
    rejects("1G51zz", /kit item 3843 is not in the catalog/);
    rejects("1G520D09", /not in increasing order/);
    rejects("1G520909", /not in increasing order/);
  });

  it("never throws on random strings, and whatever it accepts is a valid configuration", () => {
    let seed = 7;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };
    let accepted = 0;
    for (let i = 0; i < 3000; i++) {
      const length = 1 + Math.floor(next() * 24);
      const chars = "01" + ALPHABET + "-_ é%";
      const code = Array.from({ length }, (_, k) =>
        k === 0 && next() < 0.8 ? "1" : chars[Math.floor(next() * chars.length)],
      ).join("");
      const result = decode(code);
      if (result.ok) {
        accepted++;
        expect(configProblem(result.config), code).toBeNull();
        expect(decode(encode(result.config))).toEqual(result);
      } else {
        expect(typeof result.reason).toBe("string");
      }
    }
    expect(accepted).toBeGreaterThan(0);
  });

  it("falls back to the default with the reason", () => {
    expect(decodeOrDefault("1W")).toEqual({
      config: DEFAULT_CONFIG,
      reason: "section mask 32 is not defined",
    });
    expect(decodeOrDefault("111")).toEqual({
      config: { ...DEFAULT_CONFIG, look: { preset: "sepia" } },
      reason: null,
    });
  });
});

describe("encode: refuses what the code cannot carry", () => {
  const bad: [string, (c: CreateConfig) => void][] = [
    ["an unknown look", (c) => Object.assign(c, { look: { preset: "noir" } })],
    ["a look with neither preset nor custom", (c) => Object.assign(c, { look: {} })],
    [
      "hue 360",
      (c) =>
        Object.assign(c, { look: { custom: { ...MID_LOOK, spot: { hue: 360, vividness: 5 } } } }),
    ],
    [
      "hue -1",
      (c) =>
        Object.assign(c, { look: { custom: { ...MID_LOOK, paper: { hue: -1, strength: 5 } } } }),
    ],
    [
      "hue 1.5",
      (c) =>
        Object.assign(c, { look: { custom: { ...MID_LOOK, ink: { hue: 1.5, strength: 5 } } } }),
    ],
    [
      "strength 11",
      (c) => Object.assign(c, { look: { custom: { ...MID_LOOK, ink: { hue: 1, strength: 11 } } } }),
    ],
    [
      "vividness NaN",
      (c) =>
        Object.assign(c, {
          look: { custom: { ...MID_LOOK, spot: { hue: 1, vividness: Number.NaN } } },
        }),
    ],
    [
      "a missing look part",
      (c) => Object.assign(c, { look: { custom: { paper: MID_LOOK.paper } } }),
    ],
    ["outline-width 4.1", (c) => Object.assign(c.pen, { "outline-width": 4.1 })],
    ["outline-width 0.45", (c) => Object.assign(c.pen, { "outline-width": 0.45 })],
    ["ink-hachure-gap 4.2", (c) => Object.assign(c.pen, { "ink-hachure-gap": 4.2 })],
    ["a string pen value", (c) => Object.assign(c.pen, { "ink-offset": "1.5" })],
    ["halftone-size 9", (c) => Object.assign(c.screentone, { "halftone-size": 9 })],
    ["halftone-dot 0.4", (c) => Object.assign(c.screentone, { "halftone-dot": 0.4 })],
    ["a dot too large", (c) => Object.assign(c.screentone, { "halftone-dot": 2 })],
    ["speed-line-width 4.5", (c) => Object.assign(c.screentone, { "speed-line-width": 4.5 })],
    ["an unknown font", (c) => Object.assign(c.fonts, { display: "comic-sans" })],
    ["a null font", (c) => Object.assign(c.fonts, { dialogue: null })],
    ["an unknown kit", (c) => Object.assign(c, { kit: { preset: "everything" } })],
    ["a missing kit item", (c) => Object.assign(c, { kit: { custom: ["button", "theme"] } })],
    ["a kit item twice", (c) => Object.assign(c, { kit: { custom: ["button", "button"] } })],
    ["a kit with neither", (c) => Object.assign(c, { kit: {} })],
  ];
  it.each(bad)("%s", (_label, spoil) => {
    const config = base();
    spoil(config);
    expect(configProblem(config)).toEqual(expect.any(String));
    expect(() => encode(config)).toThrow(RangeError);
  });

  it("accepts the default and rejects a non-object", () => {
    expect(configProblem(DEFAULT_CONFIG)).toBeNull();
    expect(configProblem(null)).toMatch(/not an object/);
    expect(configProblem({ ...DEFAULT_CONFIG, pen: null })).toMatch(/pen is not an object/);
  });
});
