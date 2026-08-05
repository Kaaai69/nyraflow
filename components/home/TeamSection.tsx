import Image from "next/image";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function TeamSection() {
  const content = homeContent.team;

  return (
    <section id="team" className="py-section-mobile md:py-section-desktop bg-[#000000] text-[#FFFFFF]">
      <SectionContainer className="grid gap-14 lg:grid-cols-12 lg:gap-8 items-start">
        <header className="min-w-0 lg:col-span-4 lg:pr-6">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">
            Команда
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl leading-tight">
            {content.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/70">
            {content.description}
          </p>
        </header>

        <div className="grid min-w-0 gap-8 sm:grid-cols-3 lg:col-span-8 items-start">
          {content.items.map((member, index) => {
            const isCenter = index === 1;

            return (
              <article
                key={member.id}
                className={`min-w-0 group rounded-[16px] border border-white/13 bg-[#151515] overflow-hidden shadow-xl transition-all duration-300 hover:border-white/30 ${
                  isCenter ? "md:-translate-y-4" : ""
                }`}
              >
                <div className="aspect-[4/5] overflow-hidden bg-[#000000] relative">
                  <Image
                    {...member.photo}
                    sizes="(max-width: 767px) 100vw, (max-width: 1024px) 33vw, 300px"
                    className="h-full w-full object-cover filter grayscale contrast-[1.04] transition-transform duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-bold text-white/80 border border-white/20">
                    0{index + 1}
                  </span>
                </div>
                <div className="p-5 border-t border-white/10">
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-white/60">
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
