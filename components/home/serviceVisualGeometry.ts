export type Point = readonly [number, number];

export type IsoBox = Readonly<{
  /** положение ближнего нижнего угла в мировых единицах */
  x: number;
  y: number;
  z: number;
  /** размеры вдоль мировых осей */
  w: number;
  d: number;
  h: number;
}>;

export type BoxFaces = Readonly<{
  top: string;
  left: string;
  right: string;
  /** удалённость от зрителя: чем больше, тем ближе — порядок отрисовки */
  depth: number;
}>;

export type IsoView = Readonly<{
  scale: number;
  originX: number;
  originY: number;
}>;

// Классическая изометрия 2:1. Ось X уходит вправо-вниз, ось Y — влево-вниз,
// Z — строго вверх. Прежние рисунки собирались из отдельных path'ей «на глаз»,
// поэтому тела не стыковались и читались как каркас; общая проекция даёт
// сходящиеся рёбра и предсказуемый порядок перекрытия.
export function project(
  x: number,
  y: number,
  z: number,
  view: IsoView,
): Point {
  const { scale, originX, originY } = view;
  return [
    originX + (x - y) * scale,
    originY + (x + y) * scale * 0.5 - z * scale,
  ];
}

function polygon(points: readonly Point[]) {
  return (
    points
      .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(" ") + " Z"
  );
}

/**
 * Три видимые грани параллелепипеда: верх, левая (y = y+d) и правая (x = x+w).
 * Невидимые грани не рисуем вовсе — именно сквозные задние рёбра превращали
 * прошлую версию в проволочную кашу.
 */
export function boxFaces(box: IsoBox, view: IsoView): BoxFaces {
  const { x, y, z, w, d, h } = box;
  const p = (px: number, py: number, pz: number) => project(px, py, pz, view);

  return {
    top: polygon([
      p(x, y, z + h),
      p(x + w, y, z + h),
      p(x + w, y + d, z + h),
      p(x, y + d, z + h),
    ]),
    left: polygon([
      p(x, y + d, z + h),
      p(x + w, y + d, z + h),
      p(x + w, y + d, z),
      p(x, y + d, z),
    ]),
    right: polygon([
      p(x + w, y, z + h),
      p(x + w, y + d, z + h),
      p(x + w, y + d, z),
      p(x + w, y, z),
    ]),
    depth: x + y + z,
  };
}

/** Прямоугольник на верхней грани, в координатах самой плиты. */
export function topFaceRect(
  box: IsoBox,
  view: IsoView,
  left: number,
  top: number,
  right: number,
  bottom: number,
) {
  const p = (px: number, py: number) =>
    project(box.x + px, box.y + py, box.z + box.h, view);

  return polygon([p(left, top), p(right, top), p(right, bottom), p(left, bottom)]);
}

/** Рамка «контента» на плите — тот же прямоугольник с равным отступом. */
export function topFaceInset(box: IsoBox, view: IsoView, inset: number) {
  return topFaceRect(box, view, inset, inset, box.w - inset, box.d - inset);
}

export function resolveFanPosition(
  clientX: number,
  left: number,
  width: number,
  sheetCount = 15,
) {
  if (sheetCount <= 1 || width <= 0) return 0;

  const progress = Math.min(1, Math.max(0, (clientX - left) / width));
  return Math.round(progress * (sheetCount - 1));
}

// Пока курсора нет, рисунок ведёт себя сам: индекс ходит от края к краю
// треугольной волной. Без этого блок выглядел мёртвым — движение включалось
// только под курсором, а на тачскрине и при беглом взгляде не включалось вовсе.
export function ambientIndex(
  timeMs: number,
  count: number,
  periodMs: number,
  phaseMs = 0,
) {
  if (count <= 1 || periodMs <= 0) return 0;

  const wrapped = ((((timeMs + phaseMs) % periodMs) + periodMs) % periodMs);
  const progress = wrapped / periodMs;
  const triangle = progress < 0.5 ? progress * 2 : 2 - progress * 2;
  return Math.min(count - 1, Math.floor(triangle * count));
}

/**
 * Колокол вокруг активного индекса. Одно и то же затухание используют все три
 * рисунка, поэтому движение читается как одна волна, а не три разных эффекта.
 *
 * Волна поднимает тела, а не меняет их размеры: подъём — это transform, его
 * доводит CSS-переход между целыми индексами. Пересчёт геометрии на каждом
 * кадре дал бы ступеньки и лишние перерисовки на странице, где уже крутится
 * канвас фона.
 */
export function falloff(index: number, activeIndex: number, reach: number) {
  if (reach <= 0) return index === activeIndex ? 1 : 0;

  const distance = Math.abs(index - activeIndex) / reach;
  return distance >= 1 ? 0 : (1 - distance) ** 2;
}

export function waveLift(
  index: number,
  activeIndex: number,
  reach: number,
  maxLift: number,
) {
  return falloff(index, activeIndex, reach) * maxLift;
}
