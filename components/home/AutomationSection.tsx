import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionCard, MotionGrid, MotionHeading } from "../ScrollRevealSection";

/**
 * Автоматизация студии, показанная на собственном примере.
 *
 * Секция не описывает услугу, а предъявляет работающую систему: тот же
 * пресейл, через который проходят заявки самой студии. Нумерация здесь несёт
 * смысл — это последовательность, в которой заявка проходит через систему,
 * а не декоративные маркеры.
 */
export default function AutomationSection() {
  const content = homeContent.automation;

  return (
    <section
      id="automation"
      className="py-section-mobile md:py-section-desktop bg-transparent text-white"
    >
      <SectionContainer>
        <MotionHeading className="max-w-4xl">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-white/50">
            {content.eyebrow}
          </span>
          <h2 className="text-display mt-4 text-balance font-bold tracking-tight text-white">
            {content.title}
          </h2>
        </MotionHeading>

        <MotionHeading delay={0.08}>
          <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-white/70 md:text-xl">
            {content.description}
          </p>
        </MotionHeading>

        <div className="card-glass mt-12 p-8 md:mt-16 md:p-12 lg:p-14">
          <MotionGrid className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {content.steps.map((step, index) => (
              <MotionCard key={step.id} tilt={false}>
                <article className="group/step flex h-full flex-col">
                  <div className="flex items-baseline justify-between border-b border-white/12 pb-4">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-white/50">
                      0{index + 1}
                    </span>
                    <span className="font-mono text-[11px] tracking-wide text-white/40 tabular-nums">
                      {step.proof}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-bold leading-tight text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/75 transition-colors group-hover/step:text-white/90">
                    {step.description}
                  </p>
                </article>
              </MotionCard>
            ))}
          </MotionGrid>

          <div className="mt-10 flex flex-col gap-6 border-t border-white/12 pt-8 md:mt-12 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-[52ch] text-sm leading-relaxed text-white/60">
              {content.note}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={content.ctaHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#101114] shadow-md transition-all hover:scale-105 hover:bg-white/90"
              >
                {content.cta}
              </a>
              <a
                href="#contact"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition-colors hover:border-white/40"
              >
                {content.secondaryCta}
              </a>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
