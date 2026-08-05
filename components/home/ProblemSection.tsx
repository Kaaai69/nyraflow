import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function ProblemSection() {
  const content = homeContent.problem;
  const items = content.items;

  return (
    <section id="problem" className="py-section-mobile md:py-section-desktop bg-[#F3F3EF] text-[#101114]">
      <SectionContainer>
        {/* Top Header Composition */}
        <header className="grid gap-6 lg:grid-cols-12 lg:items-end border-b border-[#101114]/12 pb-12">
          <div className="lg:col-span-7">
            <span className="text-xs font-bold uppercase tracking-widest text-[#101114]/50">
              Бизнес-контекст
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#101114] sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
              {content.title}
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-lg leading-relaxed text-[#101114]/75 md:text-xl">
              {content.description}
            </p>
          </div>
        </header>

        {/* 3 Asymmetric Problem Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3 items-stretch">
          {/* Card 1 - White Card */}
          {items[0] && (
            <article className="flex flex-col justify-between rounded-[16px] border border-[#101114]/14 bg-[#FFFFFF] p-8 shadow-sm transition-all hover:border-[#101114]/30 hover:-translate-y-1">
              <div>
                <span className="text-sm font-bold tracking-widest text-[#101114]/40 uppercase">
                  01
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-[#101114]">
                  {items[0].title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-[#101114]/75">
                  {items[0].description}
                </p>
              </div>
            </article>
          )}

          {/* Card 2 - Inverted Dark Card */}
          {items[1] && (
            <article className="flex flex-col justify-between rounded-[16px] border border-[#101114] bg-[#101114] p-8 text-white shadow-xl transition-all hover:-translate-y-1">
              <div>
                <span className="text-sm font-bold tracking-widest text-white/50 uppercase">
                  02
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-white">
                  {items[1].title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-white/75">
                  {items[1].description}
                </p>
              </div>
            </article>
          )}

          {/* Card 3 - White Card */}
          {items[2] && (
            <article className="flex flex-col justify-between rounded-[16px] border border-[#101114]/14 bg-[#FFFFFF] p-8 shadow-sm transition-all hover:border-[#101114]/30 hover:-translate-y-1">
              <div>
                <span className="text-sm font-bold tracking-widest text-[#101114]/40 uppercase">
                  03
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-[#101114]">
                  {items[2].title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-[#101114]/75">
                  {items[2].description}
                </p>
              </div>
            </article>
          )}
        </div>
      </SectionContainer>
    </section>
  );
}
