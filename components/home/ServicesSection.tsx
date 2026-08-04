import { homeContent } from "../../content/home";

import { SectionContainer, SectionHeading } from "./Layout";

const serviceLabels = {
  whenNeeded: "Когда нужны",
  whatWeDo: "Что делаем",
  businessOutcome: "Что получает бизнес",
} as const;

export default function ServicesSection() {
  const content = homeContent.services;

  return (
    <section id="services" className="py-section-mobile md:py-section-desktop xl:py-section-wide">
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />

        <div className="services-list mt-14 grid gap-0 md:mt-20">
          {content.items.map((item) => (
            <article
              key={item.id}
              className="service-panel grid gap-8 rounded-media border border-line-strong bg-surface p-7 shadow-card md:p-9 lg:grid-cols-12 lg:gap-6"
            >
              <h3 className="service-title text-2xl font-semibold tracking-[-0.02em] transition-transform duration-slow ease-premium md:text-subtitle lg:col-span-3 lg:pr-5">
                {item.title}
              </h3>
              <div className="grid gap-7 md:grid-cols-3 lg:col-span-9">
                {(Object.keys(serviceLabels) as Array<keyof typeof serviceLabels>).map(
                  (key) => (
                    <div
                      key={key}
                      className={
                        key === "businessOutcome"
                          ? "service-outcome rounded-card bg-surface-blue p-5"
                          : "p-5"
                      }
                    >
                      <p className="text-sm font-semibold text-blue-deep">
                        {serviceLabels[key]}
                      </p>
                      <p className="mt-3 text-base leading-relaxed text-text-secondary">
                        {item[key]}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </article>
          ))}
        </div>

        <a href="#contact" className="button-primary mt-10 inline-flex">
          {content.cta}
        </a>
      </SectionContainer>
    </section>
  );
}
