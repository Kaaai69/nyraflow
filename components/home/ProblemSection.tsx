import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function ProblemSection() {
  const content = homeContent.problem;
  const items = content.items;

  return (
    <section id="problem" className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]">
      <SectionContainer>
        {/* Top Header Composition */}
        <header className="border-b border-white/14 pb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">
            Бизнес-контекст
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl leading-tight max-w-4xl">
            {content.title}
          </h2>
        </header>

        {/* 3 Asymmetric Problem Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3 items-stretch">
          {/* Card 1 */}
          {items[0] && (
            <article className="flex flex-col justify-between rounded-[16px] border border-white/14 bg-[#151515]/75 backdrop-blur-md p-8 shadow-xl transition-all hover:border-white/30 hover:bg-[#151515]/90 hover:-translate-y-1">
              <div>
                <span className="text-sm font-bold tracking-widest text-white/50 uppercase">
                  01
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-white">
                  {items[0].title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-white/75">
                  {items[0].description}
                </p>
              </div>
            </article>
          )}

          {/* Card 2 */}
          {items[1] && (
            <article className="flex flex-col justify-between rounded-[16px] border border-white/20 bg-[#1A1C20]/90 backdrop-blur-md p-8 text-white shadow-xl transition-all hover:border-white/40 hover:-translate-y-1">
              <div>
                <span className="text-sm font-bold tracking-widest text-white/60 uppercase">
                  02
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-white">
                  {items[1].title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-white/80">
                  {items[1].description}
                </p>
              </div>
            </article>
          )}

          {/* Card 3 */}
          {items[2] && (
            <article className="flex flex-col justify-between rounded-[16px] border border-white/14 bg-[#151515]/75 backdrop-blur-md p-8 shadow-xl transition-all hover:border-white/30 hover:bg-[#151515]/90 hover:-translate-y-1">
              <div>
                <span className="text-sm font-bold tracking-widest text-white/50 uppercase">
                  03
                </span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-white">
                  {items[2].title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-white/75">
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
