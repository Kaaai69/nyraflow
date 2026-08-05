import { CaretDownIcon } from "@phosphor-icons/react/ssr";

type FaqItem = Readonly<{ id: string; question: string; answer: string }>;

export default function FaqAccordion({
  items,
}: {
  items: readonly FaqItem[];
}) {
  return (
    <div className="grid gap-x-16 lg:grid-cols-2">
      {[items.slice(0, 3), items.slice(3)].map((column, columnIndex) => (
        <div key={columnIndex} className="border-t border-[#101114]/16">
          {column.map((item) => {
            const triggerId = `faq-trigger-${item.id}`;
            const panelId = `faq-panel-${item.id}`;

            return (
              <details
                key={item.id}
                aria-labelledby={triggerId}
                className="faq-details border-b border-[#101114]/16"
              >
                <summary
                  id={triggerId}
                  className="faq-trigger flex w-full items-start justify-between gap-5 py-7 text-left text-lg font-bold leading-snug text-[#101114] transition-colors hover:text-[#000000] md:text-xl"
                >
                  <span>{item.question}</span>
                  <CaretDownIcon
                    aria-hidden
                    size={22}
                    weight="bold"
                    className="faq-indicator mt-1 shrink-0 text-[#101114]"
                  />
                </summary>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="faq-panel"
                >
                  <p className="max-w-[65ch] pb-7 pr-8 text-base leading-relaxed text-[#101114]/75">
                    {item.answer}
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      ))}
    </div>
  );
}
