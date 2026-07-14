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
        <div key={columnIndex} className="border-t border-line">
          {column.map((item) => {
            const triggerId = `faq-trigger-${item.id}`;
            const panelId = `faq-panel-${item.id}`;

            return (
              <details
                key={item.id}
                aria-labelledby={triggerId}
                className="faq-details border-b border-line"
              >
                <summary
                  id={triggerId}
                  className="faq-trigger flex w-full items-start justify-between gap-5 py-7 text-left text-lg font-semibold leading-snug md:text-xl"
                >
                  <span>{item.question}</span>
                  <CaretDownIcon
                    aria-hidden
                    size={22}
                    weight="bold"
                    className="faq-indicator mt-1 shrink-0 text-blue"
                  />
                </summary>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="faq-panel"
                >
                  <p className="max-w-[65ch] pb-7 pr-8 text-base leading-relaxed text-text-secondary">
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
