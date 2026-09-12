import { describe, expect, it } from "vitest";

import { LAYERED_TEXT_METRICS, toRows } from "../components/ui/layered-text";

const NBSP = " ";
const WORDS = ["ТРАФИК", "ВНИМАНИЕ", "ИНТЕРЕС"] as const;

/** Нечётные строки масштабируются по вертикали в 4/3; высота прописной —
    примерно 0.72em. Больше этого потолка глифы вырастают из строки, которую
    вёрстка по-прежнему считает высотой `row`, и слова наезжают друг на друга. */
const MAX_FONT_TO_ROW = 1 / (0.72 * (4 / 3));

describe("layered text geometry", () => {
  it("keeps every breakpoint under the height at which rows collide", () => {
    for (const metrics of Object.values(LAYERED_TEXT_METRICS)) {
      expect(metrics.fontSize / metrics.row).toBeLessThanOrEqual(MAX_FONT_TO_ROW);
      expect(metrics.step).toBeGreaterThan(0);
    }
  });

  it("shrinks every dimension together as the viewport narrows", () => {
    const { desktop, tablet, mobile } = LAYERED_TEXT_METRICS;

    expect(desktop.fontSize).toBeGreaterThan(tablet.fontSize);
    expect(tablet.fontSize).toBeGreaterThan(mobile.fontSize);
    expect(desktop.row).toBeGreaterThan(tablet.row);
    expect(tablet.row).toBeGreaterThan(mobile.row);
    expect(desktop.step).toBeGreaterThan(tablet.step);
    expect(tablet.step).toBeGreaterThan(mobile.step);
  });

  it("hands every word to the row above it, so one roll swaps the whole ladder", () => {
    const rows = toRows(WORDS);

    expect(rows).toHaveLength(WORDS.length + 1);
    expect(rows[0]).toEqual({ top: NBSP, bottom: "ТРАФИК" });
    expect(rows.at(-1)).toEqual({ top: "ИНТЕРЕС", bottom: NBSP });
    rows.slice(1).forEach((row, index) => {
      expect(row.top).toBe(rows[index].bottom);
    });
  });
});
