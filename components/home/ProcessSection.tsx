import { homeContent } from "../../content/home";

import { SectionContainer } from "./Layout";

export default function ProcessSection() {
  const content = homeContent.process;

  return (
    <section id="process" className="py-section-mobile md:py-section-desktop xl:py-section-wide">
      <SectionContainer className="grid gap-12 lg:grid-cols-12 lg:gap-6">
        <header className="lg:col-span-5 lg:pr-12">
          <div className="lg:sticky lg:top-24">
            <h2 className="text-title-compact text-balance">
              {content.title}
            </h2>
            <p className="mt-7 text-lg leading-relaxed text-text-secondary md:text-xl">
              {content.description}
            </p>
          </div>
        </header>

        <div className="border-t border-line lg:col-span-7">
          {content.items.map((item) => (
            <article key={item.id} className="border-b border-line py-9 md:py-11">
              <h3 className="text-2xl font-semibold tracking-[-0.02em] md:text-subtitle">
                {item.title}
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
