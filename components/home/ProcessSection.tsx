import { ArrowRightIcon } from "@phosphor-icons/react/ssr";

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

        <ol className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:mt-20 xl:grid-cols-5">
          {content.items.map((item, index) => (
            <li key={item.id} className="relative flex flex-col">
              {index > 0 && (
                <ArrowRightIcon
                  aria-hidden
                  weight="bold"
                  size={22}
                  className="absolute -left-[1.6rem] top-[1.1rem] hidden text-line-strong xl:block"
                />
              )}
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue text-lg font-semibold text-blue">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-xl font-semibold leading-tight tracking-[-0.01em]">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </SectionContainer>
    </section>
  );
}
