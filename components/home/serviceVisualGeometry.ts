export type AutomationSheet = Readonly<{
  d: string;
  lift: number;
  opacity: number;
}>;

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

export function createAutomationSheets(activeIndex = 7): AutomationSheet[] {
  return Array.from({ length: 15 }, (_, index) => {
    const distance = Math.abs(index - activeIndex);
    const lift = Math.max(0, 26 - distance * 5);
    const x = 24 + index * 7.7;
    const baseline = 190 - index * 3.8;
    const top = 116 - index * 3.8;
    const width = 112;
    const depth = 44;

    return {
      d: [
        `M ${x.toFixed(1)} ${baseline.toFixed(1)}`,
        `L ${x.toFixed(1)} ${top.toFixed(1)}`,
        `L ${(x + width).toFixed(1)} ${(top + depth).toFixed(1)}`,
        `L ${(x + width).toFixed(1)} ${(baseline + depth).toFixed(1)}`,
      ].join(" "),
      lift,
      // Ближние к курсору листы не только приподнимаются, но и светлеют:
      // на облачном фоне одного сдвига на 26px глазом не видно.
      opacity: Math.min(0.92, 0.22 + index * 0.028 + Math.max(0, 0.42 - distance * 0.12)),
    };
  });
}
