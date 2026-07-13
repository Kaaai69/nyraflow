import Image from "next/image";

import { homeContent, type WorkMedia } from "../../content/home";

import { SectionContainer, SectionHeading } from "./Layout";

type ProjectCardProps = {
  project: WorkMedia;
  featured?: boolean;
  className?: string;
};

function ProjectCard({ project, featured = false, className }: ProjectCardProps) {
  return (
    <a
      href={project.href}
      target="_blank"
      rel="noreferrer noopener"
      className={`block ${className ?? ""}`}
    >
      <figure>
        <div className="aspect-[8/5] overflow-hidden rounded-media bg-surface">
          <Image
            src={project.src}
            alt={project.alt}
            width={project.width}
            height={project.height}
            sizes={
              featured
                ? "(max-width: 1240px) 100vw, 1112px"
                : "(max-width: 768px) 100vw, 58vw"
            }
            className="h-full w-full object-cover"
          />
        </div>
        <figcaption className="mt-4 flex items-start justify-between gap-4">
          <span>
            <span className="block text-lg font-semibold text-text-primary">
              {project.title}
            </span>
            <span className="mt-1 block text-sm font-medium text-text-secondary">
              {project.caption}
            </span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-blue-deep">
            {project.cta}
          </span>
        </figcaption>
      </figure>
    </a>
  );
}

export default function WorkSection() {
  const content = homeContent.work;
  const [featured, ...projects] = content.media;

  return (
    <section
      id="work"
      className="py-section-mobile md:py-section-desktop xl:py-section-wide"
    >
      <SectionContainer>
        <SectionHeading title={content.title} description={content.description} />

        <div className="mt-14 md:mt-20">
          {featured ? <ProjectCard project={featured} featured /> : null}

          <div className="mt-12 grid items-start gap-x-6 gap-y-14 md:mt-16 md:grid-cols-12">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                className={index % 2 === 0 ? "md:col-span-7" : "md:col-span-5"}
              />
            ))}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
