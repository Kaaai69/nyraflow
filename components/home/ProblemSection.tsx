import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function ProblemSection() {
  const content = homeContent.problem;

  return (
    <section id="problem" className="py-section-mobile md:py-section-desktop bg-[#F5F5F2] text-[#101114]">
      <SectionContainer className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <header className="lg:col-span-5 lg:pr-10">
          <h2 className="text-title text-balance text-[#101114] font-bold">
            {content.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#101114]/70 md:text-xl">
            {content.description}
          </p>
        </header>

        <div className="lg:col-span-7 lg:pl-8">
          <div className="space-y-10 border-t border-[#101114]/16 pt-8">
            {content.items.map((item) => (
              <article key={item.id} className="max-w-2xl">
                <h3 className="text-2xl font-bold tracking-tight text-[#101114] md:text-subtitle">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[#101114]/75 md:text-lg">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-12 max-w-2xl border-l-2 border-[#101114] pl-6 text-xl font-semibold leading-relaxed text-[#101114] md:text-2xl">
            {content.conclusion}
          </p>
        </div>
      </SectionContainer>
    </section>
  );
}
