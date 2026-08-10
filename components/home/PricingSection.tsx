import { CheckIcon } from "@phosphor-icons/react/ssr";

import { homeContent, type PricingItem } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";

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
        <div className="mt-14 grid items-stretch gap-6 md:mt-20 lg:grid-cols-3">
          {items.map((item) => {
            const isFeatured = item.featured;

            return (
              <article
                key={item.id}
                className={`flex flex-col justify-between rounded-[16px] p-8 transition-all duration-300 backdrop-blur-md ${
                  isFeatured
                    ? "border border-white/30 bg-white text-[#101114] shadow-2xl lg:-translate-y-6"
                    : "border border-white/14 bg-[#151515]/75 text-white shadow-xl hover:border-white/30 hover:bg-[#151515]/90 hover:-translate-y-1"
                }`}
              >
                <div>
                  {isFeatured && (
                    <span className="inline-block rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white border border-white/20 mb-6">
                      Популярный выбор
                    </span>
                  )}

                  <h3
                    className={`text-2xl font-bold tracking-tight ${
                      isFeatured ? "text-white" : "text-[#101114]"
                    }`}
                  >
                    {item.title}
                  </h3>

                  <p
                    className={`mt-4 text-4xl font-extrabold tracking-tight ${
                      isFeatured ? "text-white" : "text-[#101114]"
                    }`}
                  >
                    {item.price}
                  </p>

                  <p
                    className={`mt-4 leading-relaxed ${
                      isFeatured ? "text-white/70" : "text-[#101114]/75"
                    }`}
                  >
                    {item.description}
                  </p>

                  <div className="mt-8 space-y-3.5 border-t pt-6 border-current/12">
                    {item.included.map((line) => (
                      <p
                        key={line}
                        className={`flex gap-3 leading-relaxed text-sm ${
                          isFeatured ? "text-white/85" : "text-[#101114]/85"
                        }`}
                      >
                        <CheckIcon
                          aria-hidden
                          size={18}
                          weight="bold"
                          className={`mt-0.5 shrink-0 ${
                            isFeatured ? "text-white" : "text-[#101114]"
                          }`}
                        />
                        <span>{line}</span>
                      </p>
                    ))}

                    {item.optional?.length ? (
                      <div
                        className={`mt-6 rounded-xl p-4 text-xs ${
                          isFeatured
                            ? "border border-white/15 bg-white/5 text-white"
                            : "border border-[#101114]/12 bg-[#F3F3EF] text-[#101114]"
                        }`}
                      >
                        <p className="font-bold uppercase tracking-wider mb-2">Опционально</p>
                        {item.optional.map((line) => (
                          <p
                            key={line}
                            className={`mt-1 leading-relaxed ${
                              isFeatured ? "text-white/70" : "text-[#101114]/70"
                            }`}
                          >
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
                      ? "bg-white text-[#101114] hover:bg-[#F3F3EF] hover:scale-105 active:scale-95 shadow-md"
                      : "border border-[#101114] bg-[#101114] text-white hover:bg-black hover:scale-105 active:scale-95 shadow-sm"
                  }`}
                >
                  {content.cta}
                </a>
              </article>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
