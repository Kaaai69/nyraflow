"use client";

import { CaretDownIcon } from "@phosphor-icons/react/ssr";

type FaqItem = Readonly<{ id: string; question: string; answer: string }>;

export default function FaqAccordion({
  items,
}: {
  items: readonly FaqItem[];
}) {
  const leftColumn = items.slice(0, 3);
  const rightColumn = items.slice(3, 6);

  const renderFaqItem = (item: FaqItem, indexOffset: number) => (
    <details
      key={item.id}
      className="faq-item group border-b border-white/12 pb-4 transition-all duration-300"
    >
      <summary className="flex w-full items-start justify-between gap-4 text-left text-base md:text-lg font-bold leading-snug text-white transition-colors cursor-pointer select-none py-3">
        <div className="flex items-start gap-4 pr-2">
          <span className="text-xs font-mono font-bold tracking-widest text-white/40 uppercase mt-1 shrink-0">
            0{indexOffset}
          </span>
          <span className="group-hover:text-white/80 transition-colors">{item.question}</span>
        </div>
        <div className="w-7 h-7 rounded-full border border-white/16 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-white/40 group-open:rotate-180 group-open:bg-white/10 group-open:border-white/30 transition-all duration-300">
          <CaretDownIcon
            aria-hidden
            size={16}
            weight="bold"
            className="text-white/80 group-hover:text-white transition-colors"
          />
        </div>
      </summary>
      <div className="mt-4 pt-3 border-t border-white/10 pl-8">
        <p className="text-sm md:text-base leading-relaxed text-white/75">
          {item.answer}
        </p>
      </div>
    </details>
  );

  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 items-start">
      {/* Left Column Container */}
      <div className="space-y-4">
        {leftColumn.map((item, idx) => renderFaqItem(item, idx + 1))}
      </div>

      {/* Right Column Container */}
      <div className="space-y-4">
        {rightColumn.map((item, idx) => renderFaqItem(item, idx + 4))}
      </div>
    </div>
  );
}
