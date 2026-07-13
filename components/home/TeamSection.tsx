import Image from "next/image";

import { homeContent } from "../../content/home";

import { SectionContainer } from "./Layout";

export default function TeamSection() {
  const content = homeContent.team;

  return (
    <section id="team" className="py-section-mobile md:py-section-desktop xl:py-section-wide">
      <SectionContainer className="grid gap-14 lg:grid-cols-12 lg:gap-6">
        <header className="min-w-0 lg:col-span-5 lg:pr-10">
          <h2 className="text-team text-balance">
            {content.title}
          </h2>
          <p className="mt-7 text-lg leading-relaxed text-text-secondary md:text-xl">
            {content.description}
          </p>
        </header>

        <div className="grid min-w-0 gap-8 md:grid-cols-2 lg:col-span-7 xl:grid-cols-3 xl:gap-5">
          {content.items.map((member) => (
            <article key={member.id} className="min-w-0">
              <div className="aspect-[4/5] overflow-hidden rounded-media bg-surface-blue">
                <Image
                  {...member.photo}
                  sizes="(max-width: 767px) 100vw, (max-width: 1024px) 50vw, 34vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-5 text-xl font-semibold leading-snug tracking-[-0.02em]">
                {`${member.name}, ${member.role}`}
              </h3>
            </article>
          ))}
          <article className="min-w-0" aria-label="Место для третьего фото">
            <div className="flex aspect-[4/5] items-end rounded-media border border-line bg-surface-blue p-6">
              <p className="text-sm font-semibold text-blue-deep">
                Место для третьего фото
              </p>
            </div>
          </article>
        </div>
      </SectionContainer>
    </section>
  );
}
