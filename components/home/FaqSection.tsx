import { homeContent } from "../../content/home";

import FaqAccordion from "./FaqAccordion";
import { SectionContainer } from "./Layout";

export default function FaqSection() {
  return (
    <section id="faq" aria-label="Частые вопросы" className="py-section-mobile md:py-section-desktop bg-[#F5F5F2] text-[#101114]">
      <SectionContainer>
        <header className="mb-12 border-t border-[#101114]/16 pt-10">
          <h2 className="text-display font-bold text-[#101114]">
            Частые вопросы
          </h2>
        </header>
        <FaqAccordion items={homeContent.faq.items} />
      </SectionContainer>
    </section>
  );
}
