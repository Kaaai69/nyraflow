import Image from "next/image";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function TeamSection() {
  const content = homeContent.team;
  const originalItems = content.items;

  // Reorder so Федор (Founder) is in the center position (#2) and staggered higher
  const fedor = originalItems.find((m) => m.name === "Федор") ?? originalItems[0];
  const arseny = originalItems.find((m) => m.name === "Арсений") ?? originalItems[1];
  const artem = originalItems.find((m) => m.name === "Артём") ?? originalItems[2];

  const teamMembers = [arseny, fedor, artem];

  return (
    <section id="team" className="py-section-mobile md:py-section-desktop bg-transparent text-[#FFFFFF]">
      <SectionContainer className="grid gap-14 lg:grid-cols-12 lg:gap-12 items-center">
        {/* Left Column: Headline with generous right padding */}
        <header className="min-w-0 lg:col-span-5 lg:pr-12 xl:pr-16">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">
            Команда
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl leading-tight">
            {content.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/70 md:text-lg">
            {content.description}
          </p>
        </header>

        {/* Right Column: 3 Portrait Cards with Fedor in Center & Staggered Higher */}
        <div className="grid min-w-0 gap-6 sm:grid-cols-3 lg:col-span-7 items-stretch">
          {teamMembers.map((member, index) => {
            const isCenter = index === 1;

            return (
              <article
                key={member.id}
                className={`min-w-0 group rounded-[16px] border border-white/14 bg-[#151515]/75 backdrop-blur-md overflow-hidden shadow-xl transition-all duration-300 hover:border-white/30 hover:bg-[#151515]/90 hover:-translate-y-1 flex flex-col justify-between ${
                  isCenter ? "md:-translate-y-6" : ""
                }`}
              >
                <div className="aspect-[4/5] overflow-hidden bg-[#000000] relative">
                  <Image
                    {...member.photo}
                    sizes="(max-width: 767px) 100vw, (max-width: 1024px) 33vw, 300px"
                    className="h-full w-full object-cover filter grayscale contrast-[1.04] transition-transform duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  />
                </div>
                <div className="p-5 border-t border-white/10">
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-white/60">
                    {member.role}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
}
