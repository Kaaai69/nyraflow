export interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function frameIndexForProgress(progress: number, frameCount: number) {
  if (frameCount < 1) return 0;

  const clamped = Math.min(1, Math.max(0, progress));
  return Math.min(frameCount - 1, Math.floor(clamped * frameCount));
}

export function frameUrl(basePath: string, zeroBasedIndex: number) {
  const cleanBase = basePath.replace(/\/$/, "");
  const frameNumber = String(zeroBasedIndex + 1).padStart(3, "0");

  return `${cleanBase}/ezgif-frame-${frameNumber}.webp`;
}

export function getContainRect(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
): DrawRect {
  const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
  };
}
