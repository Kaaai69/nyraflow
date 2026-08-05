import Image from "next/image";

import { homeContent } from "../../content/home";
import { SectionContainer } from "./Layout";

export default function TeamSection() {
  const content = homeContent.team;

  return (
    <section id="team" className="py-section-mobile md:py-section-desktop xl:py-section-wide bg-[#0B0C0E]">
      <SectionContainer className="grid gap-14 lg:grid-cols-12 lg:gap-6">
        <header className="min-w-0 lg:col-span-5 lg:pr-10">
          <h2 className="text-team text-balance text-[#F1F5F9]">
            {content.title}
          </h2>
          <p className="mt-7 text-lg leading-relaxed text-[#94A3B8] md:text-xl">
            {content.description}
          </p>
        </header>

        <div className="grid min-w-0 gap-8 md:grid-cols-2 lg:col-span-7 xl:grid-cols-3 xl:gap-5">
          {content.items.map((member) => (
            <article key={member.id} className="min-w-0 group">
              <div className="aspect-[4/5] overflow-hidden rounded-media border border-white/10 bg-[#16181D]/60 backdrop-blur-md shadow-card transition-all duration-300 group-hover:border-white/20">
                <Image
                  {...member.photo}
                  sizes="(max-width: 767px) 100vw, (max-width: 1024px) 50vw, 34vw"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-5 text-xl font-semibold leading-snug tracking-[-0.02em] text-[#F1F5F9]">
                {`${member.name}, ${member.role}`}
              </h3>
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
