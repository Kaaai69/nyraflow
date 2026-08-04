import { describe, expect, it } from "vitest";

import {
  canvasBackingSize,
  frameIndexForProgress,
  frameUrl,
  getContainRect,
  priorityFrameOrder,
} from "../lib/image-sequence";

describe("image sequence helpers", () => {
  it("maps clamped scroll progress to all available frames", () => {
    expect(frameIndexForProgress(-1, 90)).toBe(0);
    expect(frameIndexForProgress(0, 90)).toBe(0);
    expect(frameIndexForProgress(0.5, 90)).toBe(45);
    expect(frameIndexForProgress(1, 90)).toBe(89);
    expect(frameIndexForProgress(2, 90)).toBe(89);
  });

  it("builds one-based, zero-padded public frame URLs", () => {
    expect(frameUrl("/animation/tunnel", 0)).toBe(
      "/animation/tunnel/ezgif-frame-001.webp",
    );
    expect(frameUrl("/animation/tunnel/", 89)).toBe(
      "/animation/tunnel/ezgif-frame-090.webp",
    );
  });

  it("centers an image without cropping or distortion", () => {
    expect(getContainRect(1200, 800, 1080, 1080)).toEqual({
      x: 200,
      y: 0,
      width: 800,
      height: 800,
    });
  });

  it("caps the canvas backing scale at two device pixels", () => {
    expect(canvasBackingSize(430, 430, 3)).toEqual({
      width: 860,
      height: 860,
      scale: 2,
    });
    expect(canvasBackingSize(430, 430, 1)).toEqual({
      width: 430,
      height: 430,
      scale: 1,
    });
  });

  it("prioritizes poster and boundary frames before filling gaps", () => {
    const order = priorityFrameOrder(90, 44);

    expect(order.slice(0, 7)).toEqual([44, 0, 89, 43, 45, 42, 46]);
    expect(new Set(order).size).toBe(90);
    expect(order).toHaveLength(90);
  });
});
