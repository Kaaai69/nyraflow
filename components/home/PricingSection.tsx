import { CheckIcon } from "@phosphor-icons/react/ssr";

import { homeContent, type PricingItem } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";
import { MotionGrid, MotionCard } from "../ScrollRevealSection";

export default function PricingSection() {
  const content = homeContent.pricing;
  const items: readonly PricingItem[] = content.items;

  return (
    <section
      id="pricing"
      className="py-section-mobile md:py-section-desktop bg-transparent text-white"
    >
      <SectionContainer>
        <SectionHeading
          title={content.title}
          description={content.description}
        />
        {/* ARCHETYPE D: Featured Inverted Accent Card */}
        <MotionGrid className="mt-14 grid items-stretch gap-8 md:mt-20 lg:grid-cols-3" staggerDelay={0.12}>
          {items.map((item) => {
            const isFeatured = item.featured;

            return (
              <MotionCard
                key={item.id}
                className={isFeatured ? "lg:-mt-6 lg:mb-6" : ""}
              >
                <article
                  className={`card-glass flex h-full flex-col justify-between p-8 text-white md:p-10 ${
                    isFeatured ? "card-glass-featured" : ""
                  }`}
                >
                  <div>
                    {isFeatured && (
                      <span className="mb-6 inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                        Популярный выбор
                      </span>
                    )}

                    <h3 className="text-2xl font-bold tracking-tight text-white">
                      {item.title}
                    </h3>

                    <p className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                      {item.price}
                    </p>

                    <p className="mt-4 leading-relaxed text-white/75">
                      {item.description}
                    </p>

                    <div className="mt-8 space-y-3.5 border-t border-white/14 pt-6">
                      {item.included.map((line) => (
                        <p
                          key={line}
                          className="flex gap-3 text-sm leading-relaxed text-white/85"
                        >
                          <CheckIcon
                            aria-hidden
                            size={18}
                            weight="bold"
                            className="mt-0.5 shrink-0 text-white"
                          />
                          <span>{line}</span>
                        </p>
                      ))}

                      {item.optional?.length ? (
                        <div
                          className="card-inset mt-6 p-4 text-xs text-white"
                        >
                          <p className="mb-2 font-bold uppercase tracking-wider text-white/60">
                            Опционально
                          </p>
                          {item.optional.map((line) => (
                            <p key={line} className="mt-1 leading-relaxed text-white/75">
                              {line}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <a
                    href="#contact"
                    className={`mt-10 flex h-13 w-full items-center justify-center rounded-full font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                      isFeatured
                        ? "bg-white text-[#101114] shadow-md hover:bg-white/90"
                        : "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {content.cta}
                  </a>
                </article>
              </MotionCard>
            );
          })}
        </MotionGrid>
      </SectionContainer>
    </section>
  );
}
