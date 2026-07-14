"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { useState } from "react";

type FaqItem = Readonly<{ id: string; question: string; answer: string }>;

export default function FaqAccordion({
  items,
}: {
  items: readonly FaqItem[];
}) {
  const [openItems, setOpenItems] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  function toggle(id: string) {
    setOpenItems((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  }

  return (
    <div className="faq-enhanced grid gap-x-16 lg:grid-cols-2">
      {[items.slice(0, 3), items.slice(3)].map((column, columnIndex) => (
        <div key={columnIndex} className="border-t border-line">
          {column.map((item) => {
            const isOpen = openItems.has(item.id);
            const triggerId = `faq-trigger-${item.id}`;
            const panelId = `faq-panel-${item.id}`;

            return (
              <div key={item.id} className="border-b border-line">
                <button
                  id={triggerId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="faq-trigger flex w-full items-start justify-between gap-5 py-7 text-left text-lg font-semibold leading-snug md:text-xl"
                  onClick={() => toggle(item.id)}
                >
                  <span>{item.question}</span>
                  <CaretDownIcon
                    aria-hidden
                    size={22}
                    weight="bold"
                    className="faq-indicator mt-1 shrink-0 text-blue"
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  aria-hidden={!isOpen}
                  className={`faq-panel grid ${isOpen ? "is-open" : ""}`}
                >
                  <div className="faq-panel-inner overflow-hidden">
                    <p className="max-w-[65ch] pb-7 pr-8 text-base leading-relaxed text-text-secondary">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
