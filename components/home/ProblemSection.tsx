import { homeContent } from "../../content/home";

import { SectionContainer } from "./Layout";

export default function ProblemSection() {
  const content = homeContent.problem;

  return (
    <section id="problem" className="py-section-mobile md:py-section-desktop xl:py-section-wide">
      <SectionContainer className="problem-layout grid gap-12 lg:grid-cols-12 lg:gap-6">
        <header className="lg:col-span-5 lg:pr-10">
          <h2 className="text-title text-balance">
            {content.title}
          </h2>
          <p className="mt-7 text-lg leading-relaxed text-text-secondary md:text-xl">
            {content.description}
          </p>
        </header>

        <div className="lg:col-span-7 lg:pl-8">
          <div className="space-y-10">
            {content.items.map((item) => (
              <article key={item.id} className="max-w-2xl">
                <h3 className="text-2xl font-semibold tracking-[-0.02em] md:text-subtitle">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-text-secondary md:text-lg">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-14 max-w-2xl border-l-2 border-blue pl-6 text-xl font-medium leading-relaxed text-blue-deep md:text-2xl">
            {content.conclusion}
          </p>
        </div>
      </SectionContainer>
    </section>
  );
}
