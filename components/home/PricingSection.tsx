import { CheckIcon } from "@phosphor-icons/react/ssr";

import { homeContent, type PricingItem } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";

export default function PricingSection() {
  const content = homeContent.pricing;
  const items: readonly PricingItem[] = content.items;

  return (
    <section
      id="pricing"
      className="py-section-mobile md:py-section-desktop xl:py-section-wide bg-[#0B0C0E]"
    >
      <SectionContainer>
        <SectionHeading
          title={content.title}
          description={content.description}
        />
        <div className="mt-14 grid items-stretch gap-5 md:mt-20 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={`grid min-w-0 grid-rows-[auto_auto_auto_1fr_auto] rounded-card p-7 backdrop-blur-md transition-all duration-300 md:p-8 ${
                item.featured
                  ? "border border-white/30 bg-gradient-to-b from-[#1C2029]/90 to-[#16181D]/90 shadow-[0_0_35px_rgba(255,255,255,0.08)] ring-1 ring-white/20"
                  : "border border-white/10 bg-[#16181D]/60 hover:border-white/20 hover:bg-[#16181D]/80"
              }`}
            >
              <div>
                {item.featured && (
                  <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#38BDF8] border border-white/15 mb-4">
                    Популярный выбор
                  </span>
                )}
                <h3 className="text-2xl font-semibold tracking-[-0.025em] text-[#F1F5F9]">
                  {item.title}
                </h3>
              </div>

              <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#F1F5F9]">
                {item.price}
              </p>

              <p className="mt-4 leading-relaxed text-[#94A3B8]">
                {item.description}
              </p>

              <div className="mt-8 space-y-3">
                {item.included.map((line) => (
                  <p
                    key={line}
                    className="flex gap-3 leading-relaxed text-[#94A3B8]"
                  >
                    <CheckIcon
                      aria-hidden
                      size={19}
                      weight="bold"
                      className="mt-1 shrink-0 text-[#38BDF8]"
                    />
                    <span>{line}</span>
                  </p>
                ))}
                {item.optional?.length ? (
                  <div className="mt-6 rounded-card border border-white/10 bg-[#1F232C]/60 p-5">
                    <p className="font-semibold text-[#F1F5F9]">Опционально</p>
                    {item.optional.map((line) => (
                      <p
                        key={line}
                        className="mt-2 text-sm leading-relaxed text-[#94A3B8]"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>

              <a
                href="#contact"
                className={`mt-9 inline-flex min-h-[3rem] items-center justify-center rounded-full px-6 font-semibold transition-all duration-200 ${
                  item.featured
                    ? "bg-white text-[#0B0C0E] shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-[#E2E8F0] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95"
                    : "border border-white/20 bg-white/10 text-[#F1F5F9] backdrop-blur-md hover:bg-white/20 hover:border-white/40 active:scale-95"
                }`}
              >
                {content.cta}
              </a>
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
