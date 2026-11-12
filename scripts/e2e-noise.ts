/**
 * Which rewritten screenshots of two exact runs (`update-snapshots=all`) on one commit are
 * stale baselines and which are run-to-run noise.
 *
 *   pnpm e2e:noise <dirA> <dirB> [--baselines=e2e/__screenshots__] [--json]
 *
 * `dirA` and `dirB` are the `playwright-baselines` artifacts of the two runs (`gh run download
 * <id> -n playwright-baselines -D <dir>`); paths are compared below their `linux/` folder. A file
 * both runs wrote with the same bytes is a stale candidate: the commit draws it that way every
 * time, so the committed baseline is what differs (its pixel count and box against the baseline
 * are printed). A file only one run wrote, or that the runs wrote differently, is noise.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

// ---------------------------------------------------------------------------------------------
// PNG: the 8-bit RGB and RGBA, non-interlaced files Chromium writes.

export interface Image {
  width: number;
  height: number;
  /** RGBA, four bytes a pixel. */
  data: Uint8Array;
}

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function decodePng(file: Buffer): Image {
  if (!file.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG");
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat: Buffer[] = [];
  for (let at = 8; at < file.length; ) {
    const length = file.readUInt32BE(at);
    const type = file.toString("latin1", at + 4, at + 8);
    const body = file.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const [depth, color, , , interlace] = body.subarray(8, 13);
      channels = color === 6 ? 4 : color === 2 ? 3 : 0;
      if (depth !== 8 || channels === 0 || interlace !== 0) {
        throw new Error(`unsupported PNG (depth ${depth}, colour type ${color})`);
      }
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const rows = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = rows.subarray(y * stride, (y + 1) * stride);
    const up = y > 0 ? rows.subarray((y - 1) * stride, y * stride) : undefined;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[x - channels] : 0;
      const b = up ? up[x] : 0;
      const c = up && x >= channels ? up[x - channels] : 0;
      let value = line[x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error(`bad PNG filter ${filter}`);
      out[x] = value & 255;
    }
  }
  if (channels === 4) return { width, height, data: rows };
  const data = new Uint8Array(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    data.set(rows.subarray(p * 3, p * 3 + 3), p * 4);
    data[p * 4 + 3] = 255;
  }
  return { width, height, data };
}

/** An RGBA PNG with no filtering (for tests and fixtures). */
export function encodePng({ width, height, data }: Image): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes: Buffer) => {
    let c = 0xffffffff;
    for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, body: Buffer) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(body.length, 0);
    head.write(type, 4, "latin1");
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc(Buffer.concat([head.subarray(4), body])), 0);
    return Buffer.concat([head, body, tail]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw.set(data.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  }
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------------------------
// Comparing

export interface Difference {
  /** Pixels whose RGBA differs at all. */
  pixels: number;
  /** Of those, pixels where a channel differs by more than 32 (more than antialiasing). */
  strong: number;
  /** `pixels` over the image area. */
  ratio: number;
  /** `[x0, y0, x1, y1]` around every differing pixel, or null when none differs. */
  box: [number, number, number, number] | null;
  /** Set when the sizes differ (and nothing else is compared). */
  size?: string;
}

export function compareImages(a: Image, b: Image): Difference {
  if (a.width !== b.width || a.height !== b.height) {
    return {
      pixels: Math.max(a.width * a.height, b.width * b.height),
      strong: 0,
      ratio: 1,
      box: null,
      size: `${b.width}x${b.height} → ${a.width}x${a.height}`,
    };
  }
  let pixels = 0;
  let strong = 0;
  let x0 = a.width;
  let y0 = a.height;
  let x1 = -1;
  let y1 = -1;
  for (let p = 0, i = 0; p < a.width * a.height; p++, i += 4) {
    let most = 0;
    for (let k = 0; k < 4; k++) most = Math.max(most, Math.abs(a.data[i + k] - b.data[i + k]));
    if (most === 0) continue;
    pixels++;
    if (most > 32) strong++;
    const x = p % a.width;
    const y = (p - x) / a.width;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return {
    pixels,
    strong,
    ratio: pixels / (a.width * a.height),
    box: pixels ? [x0, y0, x1, y1] : null,
  };
}

/** Every PNG under `dir`, as POSIX paths relative to its `linux/` folder when it has one. */
export function listShots(dir: string): Map<string, string> {
  const root = statSafe(path.join(dir, "linux"))?.isDirectory() ? path.join(dir, "linux") : dir;
  const out = new Map<string, string>();
  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".png")) {
        out.set(path.relative(root, full).split(path.sep).join("/"), full);
      }
    }
  };
  walk(root);
  return out;
}

function statSafe(file: string) {
  try {
    return statSync(file);
  } catch {
    return undefined;
  }
}

export interface Shot {
  file: string;
  /** Against the committed baseline; null when there is none. */
  baseline: Difference | null;
}

export interface NoiseShot extends Shot {
  in: "a" | "b" | "both";
  /** Between the two runs, when both wrote the file. */
  between?: Difference;
  /** Run B's file against the baseline, when both wrote it (`baseline` is run A's). */
  baselineB?: Difference | null;
}

export interface Report {
  totals: {
    a: number;
    b: number;
    both: number;
    identical: number;
    differ: number;
    onlyA: number;
    onlyB: number;
  };
  /** Same bytes in both runs: the baseline is what differs. */
  stale: Shot[];
  /** Written by one run only, or differently by the two. */
  noise: NoiseShot[];
}

export function analyse(dirA: string, dirB: string, baselines: string): Report {
  const a = listShots(dirA);
  const b = listShots(dirB);
  const base = listShots(baselines);
  const load = (file: string) => decodePng(readFileSync(file));
  const againstBaseline = (rel: string, file: string) => {
    const committed = base.get(rel);
    return committed ? compareImages(load(file), load(committed)) : null;
  };
  const stale: Shot[] = [];
  const noise: NoiseShot[] = [];
  for (const rel of [...new Set([...a.keys(), ...b.keys()])].sort()) {
    const fileA = a.get(rel);
    const fileB = b.get(rel);
    if (fileA && fileB) {
      const bytesA = readFileSync(fileA);
      const bytesB = readFileSync(fileB);
      if (bytesA.equals(bytesB)) {
        stale.push({ file: rel, baseline: againstBaseline(rel, fileA) });
      } else {
        noise.push({
          file: rel,
          in: "both",
          between: compareImages(decodePng(bytesA), decodePng(bytesB)),
          baseline: againstBaseline(rel, fileA),
          baselineB: againstBaseline(rel, fileB),
        });
      }
    } else {
      const file = (fileA ?? fileB) as string;
      noise.push({ file: rel, in: fileA ? "a" : "b", baseline: againstBaseline(rel, file) });
    }
  }
  const both = [...a.keys()].filter((rel) => b.has(rel)).length;
  return {
    totals: {
      a: a.size,
      b: b.size,
      both,
      identical: stale.length,
      differ: both - stale.length,
      onlyA: a.size - both,
      onlyB: b.size - both,
    },
    stale,
    noise,
  };
}

// ---------------------------------------------------------------------------------------------
// Printing

function explain(difference: Difference | null | undefined): string {
  if (!difference) return "no baseline";
  if (difference.size) return `size ${difference.size}`;
  if (difference.pixels === 0) return "same pixels";
  const percent = (difference.ratio * 100).toFixed(difference.ratio < 0.001 ? 3 : 2);
  return `${difference.pixels} px (${percent} %, ${difference.strong} strong) in ${difference.box?.join(",")}`;
}

export function format(report: Report, names: [string, string]): string {
  const { totals } = report;
  const lines = [
    `Stale candidates: the same bytes in both runs (${report.stale.length}), against the baseline`,
    ...report.stale.map((shot) => `  ${shot.file}  ${explain(shot.baseline)}`),
    "",
    `Noise: written by one run, or differently by the two (${report.noise.length})`,
    ...report.noise.map((shot) =>
      shot.in === "both"
        ? `  ${shot.file}  runs differ: ${explain(shot.between)}; against the baseline, ` +
          `${names[0]}: ${explain(shot.baseline)}, ${names[1]}: ${explain(shot.baselineB)}`
        : `  ${shot.file}  only ${shot.in === "a" ? names[0] : names[1]}; against the baseline: ${explain(shot.baseline)}`,
    ),
    "",
    `Totals: ${totals.a} in ${names[0]}, ${totals.b} in ${names[1]}, ${totals.both} in both ` +
      `(${totals.identical} identical, ${totals.differ} different), ${totals.onlyA} only in ` +
      `${names[0]}, ${totals.onlyB} only in ${names[1]}.`,
  ];
  return lines.join("\n");
}

function main(argv: string[]): number {
  const json = argv.includes("--json");
  const baselines =
    argv.find((arg) => arg.startsWith("--baselines="))?.slice("--baselines=".length) ??
    path.join(__dirname, "..", "e2e", "__screenshots__");
  const dirs = argv.filter((arg) => !arg.startsWith("--"));
  if (dirs.length !== 2) {
    console.error("usage: pnpm e2e:noise <dirA> <dirB> [--baselines=<dir>] [--json]");
    return 2;
  }
  const [dirA, dirB] = dirs;
  for (const dir of [dirA, dirB, baselines]) {
    if (!statSafe(dir)?.isDirectory()) {
      console.error(`not a folder: ${dir}`);
      return 2;
    }
  }
  const report = analyse(dirA, dirB, baselines);
  console.log(json ? JSON.stringify(report, null, 2) : format(report, ["A", "B"]));
  return 0;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (invoked) process.exit(main(process.argv.slice(2)));
