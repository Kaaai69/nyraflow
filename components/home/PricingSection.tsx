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
      className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]"
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
              <MotionCard key={item.id}>
                <article
                  className={`flex h-full flex-col justify-between rounded-[22px] p-8 md:p-10 transition-all duration-300 ${
                    isFeatured
                      ? "bg-[#F0EFEA] text-[#101114] border border-[#101114]/20 shadow-2xl lg:-translate-y-6 hover:scale-[1.01]"
                      : "bg-[#0E0F12]/90 text-white border border-white/14 backdrop-blur-md shadow-xl hover:border-white/28 hover:bg-[#0E0F12]/95 hover:scale-[1.01]"
                  }`}
                >
                  <div>
                    {isFeatured && (
                      <span className="inline-block rounded-full bg-[#101114] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white mb-6">
                        Популярный выбор
                      </span>
                    )}

                    <h3 className={`text-2xl font-bold tracking-tight ${isFeatured ? "text-[#101114]" : "text-white"}`}>
                      {item.title}
                    </h3>

                    <p className={`mt-4 text-4xl sm:text-5xl font-black tracking-tight ${isFeatured ? "text-[#101114]" : "text-white"}`}>
                      {item.price}
                    </p>

                    <p className={`mt-4 leading-relaxed ${isFeatured ? "text-[#101114]/75" : "text-white/75"}`}>
                      {item.description}
                    </p>

                    <div className={`mt-8 space-y-3.5 border-t pt-6 ${isFeatured ? "border-[#101114]/15" : "border-white/14"}`}>
                      {item.included.map((line) => (
                        <p
                          key={line}
                          className={`flex gap-3 leading-relaxed text-sm ${isFeatured ? "text-[#101114]/85" : "text-white/85"}`}
                        >
                          <CheckIcon
                            aria-hidden
                            size={18}
                            weight="bold"
                            className={`mt-0.5 shrink-0 ${isFeatured ? "text-[#101114]" : "text-white"}`}
                          />
                          <span>{line}</span>
                        </p>
                      ))}

                      {item.optional?.length ? (
                        <div
                          className={`mt-6 rounded-xl p-4 text-xs ${
                            isFeatured
                              ? "border border-[#101114]/15 bg-[#101114]/5 text-[#101114]"
                              : "border border-white/14 bg-white/5 text-white"
                          }`}
                        >
                          <p className={`font-bold uppercase tracking-wider mb-2 ${isFeatured ? "text-[#101114]/60" : "text-white/60"}`}>
                            Опционально
                          </p>
                          {item.optional.map((line) => (
                            <p key={line} className={`mt-1 leading-relaxed ${isFeatured ? "text-[#101114]/75" : "text-white/75"}`}>
                              {line}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <a
                    href="#contact"
                    className={`mt-10 flex h-13 w-full items-center justify-center rounded-full font-semibold transition-all duration-200 ${
                      isFeatured
                        ? "bg-[#101114] text-white hover:bg-black hover:scale-105 active:scale-95 shadow-md"
                        : "border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:scale-105 active:scale-95 shadow-sm"
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
