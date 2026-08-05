"use client";

import { CaretDownIcon } from "@phosphor-icons/react/ssr";

type FaqItem = Readonly<{ id: string; question: string; answer: string }>;

export default function FaqAccordion({
  items,
}: {
  items: readonly FaqItem[];
}) {
  // Pair items horizontally for 100% perfectly aligned row-by-row layout
  const pairs = [
    [items[0], items[3]],
    [items[1], items[4]],
    [items[2], items[5]],
  ];

  return (
    <div className="border-t border-[#101114]/16">
      {pairs.map(([leftItem, rightItem], rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 border-b border-[#101114]/16 items-start"
        >
          {/* Left Item */}
          {leftItem ? (
            <details className="faq-details group py-2">
              <summary className="faq-trigger flex w-full items-start justify-between gap-4 py-5 text-left text-base font-bold leading-snug text-[#101114] transition-colors hover:text-[#000000] md:text-lg">
                <span className="pr-2">{leftItem.question}</span>
                <CaretDownIcon
                  aria-hidden
                  size={20}
                  weight="bold"
                  className="faq-indicator mt-0.5 shrink-0 text-[#101114]"
                />
              </summary>
              <div className="faq-panel">
                <p className="pb-5 pr-6 text-sm leading-relaxed text-[#101114]/75 md:text-base">
                  {leftItem.answer}
                </p>
              </div>
            </details>
          ) : (
            <div />
          )}

          {/* Right Item */}
          {rightItem ? (
            <details className="faq-details group py-2 border-t border-[#101114]/16 lg:border-t-0">
              <summary className="faq-trigger flex w-full items-start justify-between gap-4 py-5 text-left text-base font-bold leading-snug text-[#101114] transition-colors hover:text-[#000000] md:text-lg">
                <span className="pr-2">{rightItem.question}</span>
                <CaretDownIcon
                  aria-hidden
                  size={20}
                  weight="bold"
                  className="faq-indicator mt-0.5 shrink-0 text-[#101114]"
                />
              </summary>
              <div className="faq-panel">
                <p className="pb-5 pr-6 text-sm leading-relaxed text-[#101114]/75 md:text-base">
                  {rightItem.answer}
                </p>
              </div>
            </details>
          ) : (
            <div />
          )}
        </div>
      ))}
    </div>
  );
}
