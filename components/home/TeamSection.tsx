import Image from "next/image";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function TeamSection() {
  const content = homeContent.team;

  return (
    <section id="team" className="py-section-mobile md:py-section-desktop bg-[#000000] text-[#FFFFFF]">
      <SectionContainer className="grid gap-14 lg:grid-cols-12 lg:gap-8">
        <header className="min-w-0 lg:col-span-5 lg:pr-10">
          <h2 className="text-team text-balance text-white font-bold">
            {content.title}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/70 md:text-xl">
            {content.description}
          </p>
        </header>

        <div className="grid min-w-0 gap-8 md:grid-cols-2 lg:col-span-7 xl:grid-cols-3 xl:gap-6">
          {content.items.map((member) => (
            <article key={member.id} className="min-w-0 group">
              <div className="aspect-[4/5] overflow-hidden rounded-media border border-white/14 bg-[#101114] shadow-card transition-all duration-300 group-hover:border-white/30">
                <Image
                  {...member.photo}
                  sizes="(max-width: 767px) 100vw, (max-width: 1024px) 50vw, 34vw"
                  className="h-full w-full object-cover filter grayscale contrast-[1.04] transition-transform duration-500 group-hover:scale-105 group-hover:grayscale-0"
                />
              </div>
              <h3 className="mt-4 text-lg font-bold leading-snug tracking-tight text-white">
                {`${member.name}, ${member.role}`}
              </h3>
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
