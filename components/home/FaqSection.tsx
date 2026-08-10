import { homeContent } from "../../content/home";

import FaqAccordion from "./FaqAccordion";
import { SectionContainer } from "./Layout";

export default function FaqSection() {
  return (
    <section id="faq" aria-label="Частые вопросы" className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]">
      <SectionContainer>
        <header className="mb-12 border-b border-white/14 pb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">
            Информация
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Частые вопросы
          </h2>
        </header>

        {/* Elevated Dark Container Panel for FAQ Accordion */}
        <div className="rounded-[16px] border border-white/14 bg-[#151515]/75 backdrop-blur-md p-6 md:p-10 shadow-2xl">
          <FaqAccordion items={homeContent.faq.items} />
        </div>
      </SectionContainer>
    </section>
  );
}
