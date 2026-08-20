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
        {/*
          Asymmetric composition rather than three identical columns: the
          featured tier runs full width across the top with its content in
          three columns, the other two sit side by side beneath it. The
          hierarchy is in the layout, not in a badge.
        */}
        <MotionGrid
          className="mt-14 grid items-stretch gap-6 md:mt-20 lg:grid-cols-12"
          staggerDelay={0.12}
        >
          {items.map((item) => {
            const isFeatured = item.featured;
            // Position of this tier among the non-featured ones, which decides
            // which of the two right-hand rows it lands in.
            const minorIndex = items
              .filter((tier) => !tier.featured)
              .findIndex((tier) => tier.id === item.id);

            return (
              <MotionCard
                key={item.id}
                className={
                  isFeatured
                    ? "lg:col-start-1 lg:col-span-12 lg:row-start-1"
                    : `lg:col-span-6 lg:row-start-2 ${
                        minorIndex === 0 ? "lg:col-start-1" : "lg:col-start-7"
                      }`
                }
              >
                <article
                  className={`card-glass flex h-full flex-col justify-between text-white ${
                    isFeatured
                      ? "card-glass-featured p-8 md:p-12"
                      : "p-8 md:p-9"
                  }`}
                >
                  {/* The wide featured panel splits into two columns; the
                      narrow tiers stay a single stack. */}
                  <div
                    className={
                      isFeatured
                        ? "lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-14"
                        : ""
                    }
                  >
                    <div>
                      {isFeatured && (
                        <span className="mb-6 inline-block rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                          Популярный выбор
                        </span>
                      )}

                      <h3
                        className={`font-bold tracking-tight text-white ${
                          isFeatured ? "text-display-sm" : "text-2xl"
                        }`}
                      >
                        {item.title}
                      </h3>

                      <p
                        className={`mt-4 font-black tracking-tight text-white ${
                          isFeatured
                            ? "text-5xl lg:text-6xl"
                            : "text-4xl sm:text-5xl"
                        }`}
                      >
                        {item.price}
                      </p>

                      <p className="mt-4 leading-relaxed text-white/75">
                        {item.description}
                      </p>
                    </div>

                    <div
                      className={`space-y-3.5 ${
                        isFeatured
                          ? "mt-8 border-t border-white/14 pt-6 lg:mt-0 lg:border-t-0 lg:pt-0"
                          : "mt-8 border-t border-white/14 pt-6"
                      }`}
                    >
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
                        ? "bg-white text-[#101114] shadow-md hover:bg-white/90 lg:max-w-sm"
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
