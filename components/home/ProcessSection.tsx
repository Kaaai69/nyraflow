import { homeContent } from "../../content/home";

import { SectionContainer } from "./Layout";

export default function ProcessSection() {
  const content = homeContent.process;

  return (
    <section id="process" className="py-section-mobile md:py-section-desktop xl:py-section-wide">
      <SectionContainer>
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 text-title-compact text-balance">
            {content.title}
          </h2>
        </header>

        <ol className="process-grid process-steps mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:mt-20 xl:grid-cols-5">
          {content.items.map((item) => (
            <li key={item.id} className="process-step">
              <h3 className="text-xl font-bold leading-tight tracking-[-0.01em]">
                {item.title}
              </h3>
              <p className="mt-4 text-[0.9375rem] leading-[1.65] text-text-secondary">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </SectionContainer>
    </section>
  );
}
