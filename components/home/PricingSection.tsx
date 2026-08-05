import { CheckIcon } from "@phosphor-icons/react/ssr";

import { homeContent, type PricingItem } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";

export default function PricingSection() {
  const content = homeContent.pricing;
  const items: readonly PricingItem[] = content.items;

  return (
    <section
      id="pricing"
      className="py-section-mobile md:py-section-desktop bg-[#F5F5F2] text-[#101114]"
    >
      <SectionContainer>
        <SectionHeading
          title={content.title}
          description={content.description}
          lightTheme
        />
        <div className="mt-14 grid items-stretch gap-6 md:mt-20 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={`grid min-w-0 grid-rows-[auto_auto_auto_1fr_auto] rounded-card p-7 transition-all duration-300 md:p-8 ${
                item.featured
                  ? "border border-[#101114] bg-[#101114] text-white shadow-xl"
                  : "border border-[#101114]/16 bg-white text-[#101114] shadow-sm hover:border-[#101114]/30"
              }`}
            >
              <div>
                {item.featured && (
                  <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white border border-white/20 mb-4">
                    Популярный выбор
                  </span>
                )}
                <h3
                  className={`text-2xl font-bold tracking-tight ${
                    item.featured ? "text-white" : "text-[#101114]"
                  }`}
                >
                  {item.title}
                </h3>
              </div>

              <p
                className={`mt-4 text-4xl font-bold tracking-tight ${
                  item.featured ? "text-white" : "text-[#101114]"
                }`}
              >
                {item.price}
              </p>

              <p
                className={`mt-4 leading-relaxed ${
                  item.featured ? "text-white/70" : "text-[#101114]/75"
                }`}
              >
                {item.description}
              </p>

              <div className="mt-8 space-y-3">
                {item.included.map((line) => (
                  <p
                    key={line}
                    className={`flex gap-3 leading-relaxed ${
                      item.featured ? "text-white/80" : "text-[#101114]/80"
                    }`}
                  >
                    <CheckIcon
                      aria-hidden
                      size={19}
                      weight="bold"
                      className={`mt-1 shrink-0 ${
                        item.featured ? "text-white" : "text-[#101114]"
                      }`}
                    />
                    <span>{line}</span>
                  </p>
                ))}
                {item.optional?.length ? (
                  <div
                    className={`mt-6 rounded-card p-5 ${
                      item.featured
                        ? "border border-white/15 bg-white/5 text-white"
                        : "border border-[#101114]/12 bg-[#F5F5F2] text-[#101114]"
                    }`}
                  >
                    <p className="font-bold">Опционально</p>
                    {item.optional.map((line) => (
                      <p
                        key={line}
                        className={`mt-2 text-sm leading-relaxed ${
                          item.featured ? "text-white/70" : "text-[#101114]/70"
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>

              <a
                href="#contact"
                className={`mt-9 inline-flex h-12 items-center justify-center rounded-full px-6 font-semibold transition-all duration-200 ${
                  item.featured
                    ? "bg-white text-[#101114] hover:bg-[#F5F5F2] hover:scale-105 active:scale-95"
                    : "border border-[#101114] bg-[#101114] text-white hover:bg-[#000000] hover:scale-105 active:scale-95"
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
