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

  return (
    <div className="grid gap-x-16 gap-y-0 grid-cols-1 lg:grid-cols-2 items-start">
      {/* Left Column Container */}
      <div className="divide-y divide-white/14 border-t border-b border-white/14">
        {leftColumn.map((item) => (
          <details key={item.id} className="faq-details group">
            <summary className="faq-trigger flex w-full items-center justify-between gap-4 py-6 text-left text-base md:text-lg font-bold leading-snug text-white transition-colors hover:text-white/80 cursor-pointer">
              <span className="pr-2">{item.question}</span>
              <CaretDownIcon
                aria-hidden
                size={20}
                weight="bold"
                className="faq-indicator mt-0.5 shrink-0 text-white"
              />
            </summary>
            <div className="faq-panel">
              <p className="pb-6 pr-6 text-sm md:text-base leading-relaxed text-white/75">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>

      {/* Right Column Container */}
      <div className="divide-y divide-white/14 border-t border-b border-white/14 mt-0">
        {rightColumn.map((item) => (
          <details key={item.id} className="faq-details group">
            <summary className="faq-trigger flex w-full items-center justify-between gap-4 py-6 text-left text-base md:text-lg font-bold leading-snug text-white transition-colors hover:text-white/80 cursor-pointer">
              <span className="pr-2">{item.question}</span>
              <CaretDownIcon
                aria-hidden
                size={20}
                weight="bold"
                className="faq-indicator mt-0.5 shrink-0 text-white"
              />
            </summary>
            <div className="faq-panel">
              <p className="pb-6 pr-6 text-sm md:text-base leading-relaxed text-white/75">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
