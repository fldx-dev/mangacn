// @vitest-environment node
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { analyse, compareImages, decodePng, encodePng, format, type Image } from "./e2e-noise";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

/** A 4×3 paper-coloured image with the given pixels inked. */
function image(...inked: [number, number][]): Image {
  const data = new Uint8Array(4 * 3 * 4).fill(250);
  for (const [x, y] of inked) data.set([20, 20, 20, 255], (y * 4 + x) * 4);
  return { width: 4, height: 3, data };
}

function folder(files: Record<string, Image>): string {
  const root = mkdtempSync(path.join(tmpdir(), "mangacn-noise-test-"));
  roots.push(root);
  for (const [rel, img] of Object.entries(files)) {
    const file = path.join(root, "linux", rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, encodePng(img));
  }
  return root;
}

describe("e2e:noise", () => {
  it("decodes what it encodes, and a committed baseline", () => {
    const img = image([1, 1], [3, 2]);
    expect(decodePng(encodePng(img))).toEqual({ ...img, data: Buffer.from(img.data) });

    const dir = path.join(__dirname, "../e2e/__screenshots__/linux/w360");
    const name = readdirSync(dir).find((file) => file.endsWith(".png"));
    if (!name) throw new Error("no baseline to decode");
    const baseline = decodePng(readFileSync(path.join(dir, name)));
    expect(baseline.width).toBe(360);
    expect(baseline.data.length).toBe(baseline.width * baseline.height * 4);
  });

  it("measures a difference", () => {
    expect(compareImages(image([1, 1]), image([1, 1]))).toMatchObject({ pixels: 0, box: null });
    expect(compareImages(image([1, 1], [3, 2]), image())).toMatchObject({
      pixels: 2,
      strong: 2,
      box: [1, 1, 3, 2],
    });
  });

  it("sorts the shots of two runs into stale candidates and noise", () => {
    const baselines = folder({
      "w360/stale.png": image(),
      "w360/flaky.png": image(),
      "w360/one.png": image(),
    });
    const a = folder({
      "w360/stale.png": image([0, 0]),
      "w360/flaky.png": image([2, 2]),
      "w360/one.png": image([1, 0]),
      "w360/new.png": image(),
    });
    const b = folder({ "w360/stale.png": image([0, 0]), "w360/flaky.png": image([3, 2]) });

    const report = analyse(a, b, baselines);

    expect(report.totals).toEqual({
      a: 4,
      b: 2,
      both: 2,
      identical: 1,
      differ: 1,
      onlyA: 2,
      onlyB: 0,
    });
    expect(report.stale).toEqual([
      {
        file: "w360/stale.png",
        baseline: expect.objectContaining({ pixels: 1, box: [0, 0, 0, 0] }),
      },
    ]);
    expect(report.noise.map(({ file, in: where }) => [file, where])).toEqual([
      ["w360/flaky.png", "both"],
      ["w360/new.png", "a"],
      ["w360/one.png", "a"],
    ]);
    expect(report.noise[0].between).toMatchObject({ pixels: 2, box: [2, 2, 3, 2] });
    expect(report.noise[1].baseline).toBeNull();
    expect(format(report, ["A", "B"])).toContain(
      "Totals: 4 in A, 2 in B, 2 in both (1 identical, 1 different), 2 only in A, 0 only in B.",
    );
  });
});
