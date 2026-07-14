import { homeContent } from "../../content/home";

import FaqAccordion from "./FaqAccordion";
import { SectionContainer } from "./Layout";

export default function FaqSection() {
  return (
    <section id="faq" aria-label="Частые вопросы" className="py-section-mobile md:py-section-desktop xl:py-section-wide">
      <SectionContainer>
        <FaqAccordion items={homeContent.faq.items} />
      </SectionContainer>
    </section>
  );
}
