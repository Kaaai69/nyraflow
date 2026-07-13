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
    <section id="services" className="py-20 md:py-32 xl:py-36">
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />

        <div className="mt-14 border-t border-line md:mt-20">
          {content.items.map((item) => (
            <article
              key={item.id}
              className="service-row grid gap-7 border-b border-line py-10 md:py-12 lg:grid-cols-12 lg:gap-6"
            >
              <h3 className="service-title text-2xl font-semibold tracking-[-0.02em] transition-transform duration-300 ease-out md:text-[1.75rem] lg:col-span-3 lg:pr-5">
                {item.title}
              </h3>
              <div className="grid gap-7 md:grid-cols-3 lg:col-span-9">
                {(Object.keys(serviceLabels) as Array<keyof typeof serviceLabels>).map(
                  (key) => (
                    <div key={key}>
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
