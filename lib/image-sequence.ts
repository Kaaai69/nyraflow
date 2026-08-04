export interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasBackingSize {
  width: number;
  height: number;
  scale: number;
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

export function getCoverRect(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
): DrawRect {
  const scale = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
  };
}

export function canvasBackingSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): CanvasBackingSize {
  const scale = Math.min(2, Math.max(1, devicePixelRatio));

  return {
    width: Math.round(cssWidth * scale),
    height: Math.round(cssHeight * scale),
    scale,
  };
}

export function priorityFrameOrder(frameCount: number, posterFrame: number) {
  if (frameCount < 1) return [];

  const poster = Math.min(frameCount - 1, Math.max(0, posterFrame));
  const order: number[] = [];
  const seen = new Set<number>();
  const add = (frame: number) => {
    if (frame < 0 || frame >= frameCount || seen.has(frame)) return;
    seen.add(frame);
    order.push(frame);
  };

  add(poster);
  add(0);
  add(frameCount - 1);

  for (let distance = 1; order.length < frameCount; distance += 1) {
    add(poster - distance);
    add(poster + distance);
  }

  return order;
}

export function boundedFrameOrder(
  frameCount: number,
  currentFrame: number,
  radius: number,
  posterFrame: number,
  direction: -1 | 0 | 1 = 0,
) {
  if (frameCount < 1) return [];

  const current = Math.min(frameCount - 1, Math.max(0, currentFrame));
  const poster = Math.min(frameCount - 1, Math.max(0, posterFrame));
  const safeRadius = Math.max(0, Math.floor(radius));
  const order: number[] = [];
  const seen = new Set<number>();
  const add = (frame: number) => {
    if (frame < 0 || frame >= frameCount || seen.has(frame)) return;
    seen.add(frame);
    order.push(frame);
  };

  add(current);
  for (let distance = 1; distance <= safeRadius; distance += 1) {
    if (direction >= 0) {
      add(current + distance);
      add(current - distance);
    } else {
      add(current - distance);
      add(current + distance);
    }
  }

  add(poster);
  add(0);
  add(frameCount - 1);

  return order;
}
