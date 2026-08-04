import { describe, expect, it } from "vitest";

import {
  frameIndexForProgress,
  frameUrl,
  getContainRect,
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
});
