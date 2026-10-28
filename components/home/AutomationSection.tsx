import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";
import { MotionCard, MotionGrid, MotionHeading } from "../ScrollRevealSection";

/**
 * Разбор задачи в Telegram — пресейл самой студии, предложенный клиенту как
 * проверка за две минуты.
 *
 * Секция продаёт результат, а не инструмент: три шага описывают путь клиента,
 * технология уходит строкой мелкого шрифта. Порядок шагов читается по
 * соединительной линии, поэтому цифр нет — линия и есть последовательность.
 */
export default function AutomationSection() {
  const content = homeContent.automation;

  return (
    <section
      id="automation"
      className="py-section-mobile md:py-section-desktop bg-transparent text-white"
    >
      <SectionContainer>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
          <header className="min-w-0 lg:col-span-7">
            <MotionHeading>
              <h2 className="text-display text-balance font-bold tracking-tight text-white">
                {content.title}
              </h2>
              <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-white/70 md:text-xl">
                {content.description}
              </p>
            </MotionHeading>
          </header>

          <div className="lg:col-span-5 lg:pb-2">
            <MotionHeading delay={0.08}>
              <a
                href={content.ctaHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#101114] shadow-md transition-all hover:scale-105 hover:bg-white/90"
              >
                {content.cta}
              </a>
              {/* Кнопка уводит с сайта в Telegram. Без подписи человек попадает
                  на страницу бота и не понимает, куда его привели. */}
              <p className="mt-3 max-w-[40ch] text-xs leading-relaxed text-white/60">
                {content.ctaHint}
              </p>
            </MotionHeading>
          </div>
        </div>

        <MotionGrid className="mt-14 md:mt-20" staggerDelay={0.12}>
          <ol className="grid gap-10 md:grid-cols-3 md:gap-10 lg:gap-14">
            {content.steps.map((step) => (
              <li key={step.id}>
                <MotionCard tilt={false} radius="12px">
                  {/* Линия с точкой: сверху на широком экране, слева на узком. */}
                  <div className="relative border-l border-white/30 pl-6 md:border-l-0 md:border-t md:pl-0 md:pt-8">
                    <span
                      aria-hidden
                      className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-white md:left-0 md:-top-[5px]"
                    />
                    <h3 className="text-xl font-bold leading-tight text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-[32ch] text-base leading-relaxed text-white/70">
                      {step.detail}
                    </p>
                  </div>
                </MotionCard>
              </li>
            ))}
          </ol>
        </MotionGrid>

        <p className="mt-12 max-w-[60ch] text-xs leading-relaxed text-white/55 md:mt-16">
          {content.tech}
        </p>
      </SectionContainer>
    </section>
  );
}
