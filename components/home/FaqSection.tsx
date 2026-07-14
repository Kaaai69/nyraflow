import { homeContent } from "../../content/home";

import FaqAccordion from "./FaqAccordion";
import { SectionContainer } from "./Layout";

export default function FaqSection() {
  const columns = [homeContent.faq.items.slice(0, 3), homeContent.faq.items.slice(3)];

  return (
    <section id="faq" aria-label="Частые вопросы" className="py-section-mobile md:py-section-desktop xl:py-section-wide">
      <SectionContainer>
        <FaqAccordion items={homeContent.faq.items} />
        <noscript>
          <style>{".faq-enhanced{display:none!important}"}</style>
          <div className="faq-no-js grid gap-x-16 lg:grid-cols-2">
            {columns.map((column, columnIndex) => (
              <div key={columnIndex} className="border-t border-line">
                {column.map((item) => (
                  <article key={item.id} className="border-b border-line py-7">
                    <h3 className="text-lg font-semibold leading-snug md:text-xl">
                      {item.question}
                    </h3>
                    <p className="mt-4 max-w-[65ch] pr-8 text-base leading-relaxed text-text-secondary">
                      {item.answer}
                    </p>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </noscript>
      </SectionContainer>
    </section>
  );
}
