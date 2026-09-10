import { describe, expect, it } from "vitest";

import {
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
