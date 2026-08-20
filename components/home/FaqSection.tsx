import { homeContent } from "../../content/home";

import FaqAccordion from "./FaqAccordion";
import { SectionContainer } from "./Layout";
import { MotionHeading } from "../ScrollRevealSection";

export default function FaqSection() {
  return (
    <section id="faq" aria-label="Частые вопросы" className="py-section-mobile md:py-section-desktop bg-transparent text-white">
      <SectionContainer>
        <header className="mb-12 border-b border-white/14 pb-8">
          <MotionHeading>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-white/50">
              Информация
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Частые вопросы
            </h2>
          </MotionHeading>
        </header>

        {/* Open Editorial FAQ Layout (No Giant Outer Card Box) */}
        <div className="py-4">
          <FaqAccordion items={homeContent.faq.items} />
        </div>
      </SectionContainer>
    </section>
  );
}
