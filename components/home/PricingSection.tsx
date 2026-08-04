import { CheckIcon } from "@phosphor-icons/react/ssr";

import { homeContent, type PricingItem } from "../../content/home";
import { SectionContainer, SectionHeading } from "./Layout";

export default function PricingSection() {
  const content = homeContent.pricing;
  const items: readonly PricingItem[] = content.items;

  return (
    <section
      id="pricing"
      className="py-section-mobile md:py-section-desktop xl:py-section-wide"
    >
      <SectionContainer>
        <SectionHeading
          title={content.title}
          description={content.description}
        />
        <div className="pricing-grid mt-14 grid items-stretch gap-5 md:mt-20 lg:grid-cols-12">
          {items.map((item) => (
            <article
              key={item.id}
              className={`pricing-card grid min-w-0 grid-rows-[auto_auto_auto_1fr_auto] p-7 md:p-8 ${item.featured ? "pricing-card-featured" : ""}`}
            >
              <h3 className="text-2xl font-semibold tracking-[-0.025em]">
                {item.title}
              </h3>
              <p className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-blue-deep">
                {item.price}
              </p>
              <p className="mt-5 leading-relaxed text-text-secondary">
                {item.description}
              </p>
              <div className="mt-9 space-y-3">
                {item.included.map((line) => (
                  <p
                    key={line}
                    className="flex gap-3 leading-relaxed text-text-secondary"
                  >
                    <CheckIcon
                      aria-hidden
                      size={19}
                      weight="bold"
                      className="mt-1 shrink-0 text-cyan"
                    />
                    <span>{line}</span>
                  </p>
                ))}
                {item.optional?.length ? (
                  <div className="mt-7 rounded-card bg-surface-blue p-5">
                    <p className="font-semibold text-text-primary">Опционально</p>
                    {item.optional.map((line) => (
                      <p
                        key={line}
                        className="mt-2 text-sm leading-relaxed text-text-secondary"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
              <a
                href="#contact"
                className="button-primary mt-9 inline-flex justify-center"
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
