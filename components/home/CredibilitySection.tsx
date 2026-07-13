import { homeContent } from "../../content/home";

import { SectionContainer } from "./Layout";

export default function CredibilitySection() {
  return (
    <section id="credibility" aria-label="Почему нам доверяют" className="py-section-mobile md:py-section-credibility">
      <SectionContainer>
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {homeContent.credibility.items.map((item) => (
            <article
              key={item.id}
              className="rounded-card border border-line bg-surface p-7 shadow-card md:p-8"
            >
              <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em]">
                {item.title}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
