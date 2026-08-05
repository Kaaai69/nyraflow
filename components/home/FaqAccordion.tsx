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
      <div className="divide-y divide-[#101114]/16 border-t border-b border-[#101114]/16">
        {leftColumn.map((item) => (
          <details key={item.id} className="faq-details group">
            <summary className="faq-trigger flex w-full items-center justify-between gap-4 py-6 text-left text-base md:text-lg font-bold leading-snug text-[#101114] transition-colors hover:text-[#000000]">
              <span className="pr-2">{item.question}</span>
              <CaretDownIcon
                aria-hidden
                size={20}
                weight="bold"
                className="faq-indicator mt-0.5 shrink-0 text-[#101114]"
              />
            </summary>
            <div className="faq-panel">
              <p className="pb-6 pr-6 text-sm md:text-base leading-relaxed text-[#101114]/75">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>

      {/* Right Column Container */}
      <div className="divide-y divide-[#101114]/16 border-t border-b border-[#101114]/16 mt-0">
        {rightColumn.map((item) => (
          <details key={item.id} className="faq-details group">
            <summary className="faq-trigger flex w-full items-center justify-between gap-4 py-6 text-left text-base md:text-lg font-bold leading-snug text-[#101114] transition-colors hover:text-[#000000]">
              <span className="pr-2">{item.question}</span>
              <CaretDownIcon
                aria-hidden
                size={20}
                weight="bold"
                className="faq-indicator mt-0.5 shrink-0 text-[#101114]"
              />
            </summary>
            <div className="faq-panel">
              <p className="pb-6 pr-6 text-sm md:text-base leading-relaxed text-[#101114]/75">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
