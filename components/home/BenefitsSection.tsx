import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionGrid, MotionCard } from "../ScrollRevealSection";

/**
 * Условия работы одной строкой под прайсом: это снятие возражений о цене,
 * а не отдельный разговор. Без рамки, иконок и нумерации — только линия
 * над каждым пунктом.
 */
export default function BenefitsSection() {
  const content = homeContent.benefits;

  return (
    <section
      id="benefits"
      aria-labelledby="benefits-heading"
      className="py-10 md:py-14 bg-transparent text-white"
    >
      <SectionContainer>
        <h2 id="benefits-heading" className="sr-only">
          {content.title}
        </h2>
        <MotionGrid
          className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4"
          staggerDelay={0.08}
        >
          {content.items.map((item) => (
            <MotionCard key={item.id} tilt={false} radius="12px">
              <article className="h-full border-t border-white/30 pt-5">
                <h3 className="text-base font-bold leading-snug text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {item.description}
                </p>
              </article>
            </MotionCard>
          ))}
        </MotionGrid>
      </SectionContainer>
    </section>
  );
}
