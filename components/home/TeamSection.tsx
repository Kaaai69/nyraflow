import Image from "next/image";

import { homeContent } from "../../content/home";

import { SectionContainer } from "./Layout";

export default function TeamSection() {
  const content = homeContent.team;

  return (
    <section id="team" className="py-section-mobile md:py-section-desktop xl:py-section-wide">
      <SectionContainer className="grid gap-14 lg:grid-cols-12 lg:gap-6">
        <header className="lg:col-span-4 lg:pr-10">
          <h2 className="text-title-compact text-balance">
            {content.title}
          </h2>
          <p className="mt-7 text-lg leading-relaxed text-text-secondary md:text-xl">
            {content.description}
          </p>
        </header>

        <div className="grid gap-10 md:grid-cols-2 lg:col-span-8 lg:gap-6">
          {content.items.map((member, index) => (
            <article key={member.id} className={index === 1 ? "md:mt-20" : ""}>
              <div
                className={`overflow-hidden rounded-media bg-surface-blue ${
                  index === 0 ? "aspect-[4/3]" : "aspect-[4/5]"
                }`}
              >
                <Image
                  src={member.photo.src}
                  alt={member.photo.alt}
                  width={member.photo.width}
                  height={member.photo.height}
                  sizes="(max-width: 767px) 100vw, (max-width: 1024px) 50vw, 34vw"
                  className="h-full w-full object-cover saturate-[0.82] contrast-[1.02]"
                />
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">
                {member.name}
              </h3>
              {member.isRoleConfirmed ? (
                <>
                  <p className="mt-2 font-medium text-blue-deep">{member.role}</p>
                  <p className="mt-4 text-base leading-relaxed text-text-secondary">
                    {member.description}
                  </p>
                </>
              ) : null}
            </article>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
