import { homeContent } from "../../content/home";

import FaqAccordion from "./FaqAccordion";
import { SectionContainer } from "./Layout";

export default function FaqSection() {
  return (
    <section id="faq" aria-label="Частые вопросы" className="py-section-mobile md:py-section-desktop bg-[#F3F3EF] text-[#101114]">
      <SectionContainer>
        <header className="mb-12 border-b border-[#101114]/12 pb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#101114]/50">
            Информация
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#101114] sm:text-4xl md:text-5xl">
            Частые вопросы
          </h2>
        </header>

        {/* Elevated White Container Panel for FAQ Accordion */}
        <div className="rounded-[16px] border border-[#101114]/14 bg-[#FFFFFF] p-6 md:p-10 shadow-sm">
          <FaqAccordion items={homeContent.faq.items} />
        </div>
      </SectionContainer>
    </section>
  );
}
