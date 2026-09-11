import { describe, expect, it } from "vitest";

import {
  ambientIndex,
  createAutomationSheets,
  resolveFanPosition,
} from "../components/home/serviceVisualGeometry";

describe("automation service visual geometry", () => {
  it("maps pointer and touch coordinates to the full fan range", () => {
    expect(resolveFanPosition(100, 100, 300, 15)).toBe(0);
    expect(resolveFanPosition(250, 100, 300, 15)).toBe(7);
    expect(resolveFanPosition(400, 100, 300, 15)).toBe(14);
  });

  it("raises the sheets nearest to the current pointer position", () => {
    const left = createAutomationSheets(0);
    const right = createAutomationSheets(14);

    expect(left[0].lift).toBeGreaterThan(left[14].lift);
    expect(right[14].lift).toBeGreaterThan(right[0].lift);
    expect(left).toHaveLength(15);
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
});
