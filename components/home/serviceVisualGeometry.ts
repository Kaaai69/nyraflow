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

export function createAutomationSheets(activeIndex = 7): AutomationSheet[] {
  return Array.from({ length: 15 }, (_, index) => {
    const distance = Math.abs(index - activeIndex);
    const lift = Math.max(0, 24 - distance * 5);
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
      opacity: 0.28 + index * 0.035,
    };
  });
}
