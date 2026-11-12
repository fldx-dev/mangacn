import { describe, expect, it } from "vitest";
import { configProblem, decode, encode } from "./code";
import {
  type CreateConfig,
  DEFAULT_CONFIG,
  LOOK_PRESETS,
  PEN_RANGES,
  PENS,
  penName,
  rangeIndex,
  SCREENTONE_RANGES,
  screentoneProblem,
} from "./config";
import {
  CUSTOM_STARTS,
  codeFromInput,
  createReducer,
  maxDot,
  readPastedCode,
  shuffleConfig,
  snap,
  urlWithCode,
  withScreentone,
} from "./state";

/** A seeded generator (mulberry32), so a failing shuffle can be replayed. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const run = (...actions: Parameters<typeof createReducer>[1][]) =>
  actions.reduce(createReducer, DEFAULT_CONFIG);

describe("snap and the screentone clamp", () => {
  it("snaps a value onto its range's steps, inside it", () => {
    const range = PEN_RANGES["outline-width"];
    expect(snap(range, 1.53)).toBe(1.5);
    expect(snap(range, 0.1)).toBe(0.5);
    expect(snap(range, 9)).toBe(4);
    expect(snap(range, Number.NaN)).toBe(0.5);
  });

  it("gives the largest dot each pitch holds", () => {
    for (let i = 0; i <= 10; i++) {
      const size = 3 + i * 0.5;
      const dot = maxDot(size);
      expect(screentoneProblem({ "halftone-size": size, "halftone-dot": dot, "speed-line-width": 2 }))
        .toBeNull();
      const next = Number((dot + 0.1).toFixed(1));
      if (next <= SCREENTONE_RANGES["halftone-dot"].max) {
        expect(
          screentoneProblem({ "halftone-size": size, "halftone-dot": next, "speed-line-width": 2 }),
        ).not.toBeNull();
      }
    }
    expect(maxDot(3)).toBe(1);
    expect(maxDot(4)).toBe(1.5);
    expect(maxDot(8)).toBe(3.5);
  });

  it("clamps a dot that outgrows its pitch, and pulls it down with a smaller pitch", () => {
    const tone = DEFAULT_CONFIG.screentone;
    expect(withScreentone(tone, "halftone-dot", 3.5)["halftone-dot"]).toBe(1.5);
    const big = withScreentone(withScreentone(tone, "halftone-size", 8), "halftone-dot", 3.2);
    expect(big["halftone-dot"]).toBe(3.2);
    expect(withScreentone(big, "halftone-size", 3)).toMatchObject({
      "halftone-size": 3,
      "halftone-dot": 1,
    });
  });
});

describe("the reducer", () => {
  it("chooses a shipped look", () => {
    expect(run({ type: "look-preset", preset: "sepia" }).look).toEqual({ preset: "sepia" });
    expect(encode(run({ type: "look-preset", preset: "sepia" }))).toBe("111");
  });

  it("starts a custom look from the current look's nearest settings", () => {
    const config = run({ type: "look-preset", preset: "sepia" }, { type: "look-custom" });
    expect(config.look).toEqual({ custom: CUSTOM_STARTS.sepia });
    // Choosing Custom again keeps the values.
    const tuned = createReducer(config, { type: "look-value", part: "spot", key: "hue", value: 200 });
    expect(createReducer(tuned, { type: "look-custom" })).toBe(tuned);
  });

  it("moves one custom value at a time, snapped into its range", () => {
    const config = run(
      { type: "look-custom" },
      { type: "look-value", part: "paper", key: "hue", value: 120.4 },
      { type: "look-value", part: "ink", key: "strength", value: 42 },
      { type: "look-value", part: "spot", key: "vividness", value: -3 },
    );
    expect(config.look).toEqual({
      custom: {
        paper: { hue: 120, strength: CUSTOM_STARTS.default.paper.strength },
        ink: { hue: CUSTOM_STARTS.default.ink.hue, strength: 10 },
        spot: { hue: CUSTOM_STARTS.default.spot.hue, vividness: 0 },
      },
    });
  });

  it("every custom start is a valid look", () => {
    for (const preset of LOOK_PRESETS) {
      expect(configProblem({ ...DEFAULT_CONFIG, look: { custom: CUSTOM_STARTS[preset] } })).toBeNull();
    }
  });

  it("names a pen, and a moved slider leaves it a custom pen", () => {
    const brush = run({ type: "pen-name", name: "brush" });
    expect(penName(brush.pen)).toBe("brush");
    expect(encode(brush)).toBe("122");
    const moved = createReducer(brush, { type: "pen-value", token: "ink-bowing", value: 0.33 });
    expect(moved.pen["ink-bowing"]).toBe(0.3);
    expect(penName(moved.pen)).toBeNull();
    expect(PENS.brush["ink-bowing"]).toBe(1.4);
  });

  it("chooses fonts and a kit, resets, and replaces", () => {
    const config = run(
      { type: "display-font", font: "reggae-one" },
      { type: "dialogue-font", font: "patrick-hand-sc" },
      { type: "kit", kit: "chat" },
    );
    expect(config.fonts).toEqual({ display: "reggae-one", dialogue: "patrick-hand-sc" });
    expect(config.kit).toEqual({ preset: "chat" });
    expect(createReducer(config, { type: "reset" })).toEqual(DEFAULT_CONFIG);
    expect(createReducer(DEFAULT_CONFIG, { type: "replace", config })).toBe(config);
  });

  it("only ever produces configurations encode accepts", () => {
    const random = seeded(4);
    let config: CreateConfig = DEFAULT_CONFIG;
    const tokens = Object.keys(PEN_RANGES) as (keyof typeof PEN_RANGES)[];
    const tones = Object.keys(SCREENTONE_RANGES) as (keyof typeof SCREENTONE_RANGES)[];
    for (let i = 0; i < 2000; i++) {
      const r = random();
      const value = random() * 400 - 20;
      config =
        r < 0.3
          ? createReducer(config, { type: "screentone", token: tones[i % 3], value: value / 40 })
          : r < 0.6
            ? createReducer(config, { type: "pen-value", token: tokens[i % 6], value: value / 50 })
            : r < 0.8
              ? createReducer(config, { type: "look-value", part: "paper", key: "hue", value })
              : createReducer(config, { type: "look-value", part: "spot", key: "vividness", value });
      expect(configProblem(config)).toBeNull();
    }
  });
});

describe("shuffle", () => {
  it("always yields a configuration decode accepts, unchanged by a round trip", () => {
    const random = seeded(20261112);
    const looks = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const config = shuffleConfig(random);
      const result = decode(encode(config));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.config).toEqual(config);
      looks.add("preset" in config.look ? config.look.preset : "custom");
      for (const [token, range] of Object.entries(PEN_RANGES)) {
        expect(rangeIndex(range, config.pen[token as keyof typeof PEN_RANGES])).not.toBe(-1);
      }
    }
    expect(looks.size).toBe(5);
  });

  it("uses Math.random by default", () => {
    expect(configProblem(shuffleConfig())).toBeNull();
  });
});

describe("pasted codes", () => {
  it("finds the code in a bare code, a Create URL or a path", () => {
    expect(codeFromInput("  111 ")).toBe("111");
    expect(codeFromInput("https://www.mangacn.com/create?c=1312")).toBe("1312");
    expect(codeFromInput("/create?x=1&c=111#preview")).toBe("111");
    expect(codeFromInput("https://www.mangacn.com/create")).toBe("");
  });

  it("opens a valid code in its canonical form and says why it refuses the rest", () => {
    expect(readPastedCode("https://www.mangacn.com/create?c=111")).toMatchObject({
      ok: true,
      code: "111",
    });
    expect(readPastedCode("")).toEqual({
      ok: false,
      reason: "there is no code in what was pasted",
    });
    const refused = readPastedCode("1z");
    expect(refused.ok).toBe(false);
    expect(readPastedCode("<script>")).toMatchObject({ ok: false });
    expect(readPastedCode("9abc")).toEqual({ ok: false, reason: "code version 9 is not known" });
  });
});

describe("urlWithCode", () => {
  it("sets ?c= and keeps the path, other parameters and the hash", () => {
    expect(urlWithCode("https://www.mangacn.com/create", "111")).toBe("/create?c=111");
    expect(urlWithCode("https://www.mangacn.com/create?c=10&x=1#a", "1312")).toBe(
      "/create?c=1312&x=1#a",
    );
  });
});
