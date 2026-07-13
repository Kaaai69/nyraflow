import Image from "next/image";

import { homeContent } from "../../content/home";

import { SectionContainer, SectionHeading } from "./Layout";

export default function WorkSection() {
  const content = homeContent.work;
  const published = content.media.find((media) => media.status === "published");
  const concepts = content.media.filter((media) => media.status === "concept");

  return (
    <section id="work" className="py-20 md:py-32 xl:py-36">
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />

        <div className="mt-14 md:mt-20">
          {published ? (
            <figure>
              <div className="overflow-hidden rounded-[28px] bg-surface">
                <Image
                  src={published.src}
                  alt={published.alt}
                  width={published.width}
                  height={published.height}
                  sizes="(max-width: 1240px) 100vw, 1112px"
                  className="h-auto w-full object-cover"
                />
              </div>
              <figcaption className="mt-4 flex flex-col items-start gap-4 text-sm font-medium text-text-secondary md:flex-row md:items-center md:justify-between">
                <span>{published.caption}</span>
                <a
                  href={published.href}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-blue px-5 font-semibold whitespace-nowrap text-blue-deep transition-transform duration-200 hover:-translate-y-px"
                >
                  {published.cta}
                </a>
              </figcaption>
            </figure>
          ) : null}

          <div className="mt-12 grid items-start gap-8 md:mt-16 md:grid-cols-12 md:gap-6">
            {concepts.map((media, index) => (
              <figure
                key={media.src}
                className={index === 0 ? "md:col-span-7" : "md:col-span-5 md:mt-24"}
              >
                <div
                  className={`overflow-hidden rounded-[28px] bg-surface ${
                    index === 0 ? "aspect-[8/5]" : "aspect-[4/5]"
                  }`}
                >
                  <Image
                    src={media.src}
                    alt={media.alt}
                    width={media.width}
                    height={media.height}
                    sizes={index === 0 ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 42vw"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="mt-4 text-sm font-semibold text-blue-deep">
                  {media.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
