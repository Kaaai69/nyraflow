import { homeContent } from "../../content/home";

import { SectionContainer } from "./Layout";

export default function FaqSection() {
  const columns = [homeContent.faq.items.slice(0, 3), homeContent.faq.items.slice(3)];

  return (
    <section id="faq" aria-label="Частые вопросы" className="py-20 md:py-32 xl:py-36">
      <SectionContainer>
        <div className="grid gap-x-16 lg:grid-cols-2">
          {columns.map((items, columnIndex) => (
            <div
              key={columnIndex}
              className={columnIndex === 0 ? "border-t border-line" : "border-line lg:border-t"}
            >
              {items.map((item) => (
                <details key={item.id} className="group border-b border-line">
                  <summary className="cursor-pointer py-7 pr-4 text-lg font-semibold leading-snug marker:text-blue focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue/25 md:text-xl">
                    {item.question}
                  </summary>
                  <p className="max-w-[65ch] pb-7 pr-6 text-base leading-relaxed text-text-secondary">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
