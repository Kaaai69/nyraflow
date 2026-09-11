import { describe, expect, it } from "vitest";

import {
  ambientIndex,
  boxFaces,
  falloff,
  project,
  resolveFanPosition,
  topFaceInset,
  waveLift,
  type IsoBox,
  type IsoView,
} from "../components/home/serviceVisualGeometry";

const view: IsoView = { scale: 10, originX: 100, originY: 50 };

describe("isometric projection", () => {
  it("sends the world axes to the 2:1 isometric directions", () => {
    expect(project(0, 0, 0, view)).toEqual([100, 50]);
    // +X — вправо-вниз, +Y — влево-вниз, +Z — строго вверх.
    expect(project(1, 0, 0, view)).toEqual([110, 55]);
    expect(project(0, 1, 0, view)).toEqual([90, 55]);
    expect(project(0, 0, 1, view)).toEqual([100, 40]);
  });

  it("draws only the three visible faces of a box, meeting at the near corner", () => {
    const box: IsoBox = { x: 0, y: 0, z: 0, w: 2, d: 2, h: 1 };
    const faces = boxFaces(box, view);
    const near = project(box.w, box.d, 0, view);
    const nearPoint = `${near[0].toFixed(2)} ${near[1].toFixed(2)}`;

    for (const face of [faces.top, faces.left, faces.right]) {
      expect(face.startsWith("M ")).toBe(true);
      expect(face.endsWith(" Z")).toBe(true);
      expect(face.match(/[ML]/g)).toHaveLength(4);
    }
    // Левая и правая грани сходятся в ближнем нижнем углу — иначе тело
    // разъезжается и снова читается как каркас.
    expect(faces.left).toContain(nearPoint);
    expect(faces.right).toContain(nearPoint);
  });

  it("orders bodies front to back by their world position", () => {
    const back = boxFaces({ x: 0, y: 0, z: 0, w: 1, d: 1, h: 1 }, view);
    const front = boxFaces({ x: 3, y: 3, z: 0, w: 1, d: 1, h: 1 }, view);

    expect(front.depth).toBeGreaterThan(back.depth);
  });

  it("keeps the top-face inset inside the top face", () => {
    const box: IsoBox = { x: 0, y: 0, z: 0, w: 4, d: 4, h: 1 };
    const inset = topFaceInset(box, view, 1);

    expect(inset).toContain(project(1, 1, 1, view)[0].toFixed(2));
    expect(inset.match(/[ML]/g)).toHaveLength(4);
  });
});

describe("pointer tracking", () => {
  it("maps pointer and touch coordinates to the full range", () => {
    expect(resolveFanPosition(100, 100, 300, 15)).toBe(0);
    expect(resolveFanPosition(250, 100, 300, 15)).toBe(7);
    expect(resolveFanPosition(400, 100, 300, 15)).toBe(14);
  });
});

describe("ambient motion", () => {
  it("sweeps the full range and comes back within one period", () => {
    expect(ambientIndex(0, 15, 1000)).toBe(0);
    expect(ambientIndex(500, 15, 1000)).toBe(14);
    expect(ambientIndex(1000, 15, 1000)).toBe(0);
  });

  it("stays inside the range for any time, phase or degenerate input", () => {
    for (const t of [-5000, 0, 137, 999_999]) {
      const index = ambientIndex(t, 4, 6400, 900);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(3);
    }
    expect(ambientIndex(123, 1, 1000)).toBe(0);
    expect(ambientIndex(123, 15, 0)).toBe(0);
  });

  it("raises bodies near the active one and leaves distant ones alone", () => {
    expect(falloff(5, 5, 3)).toBe(1);
    expect(falloff(6, 5, 3)).toBeGreaterThan(falloff(7, 5, 3));
    expect(falloff(9, 5, 3)).toBe(0);
    expect(waveLift(5, 5, 3, 26)).toBe(26);
    expect(waveLift(0, 5, 3, 26)).toBe(0);
  });
});
