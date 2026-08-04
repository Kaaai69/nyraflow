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
      className={`project-card block overflow-hidden rounded-media border border-line-strong bg-surface p-3 shadow-card md:p-4 ${className ?? ""}`}
    >
      <figure>
        <div className="aspect-[8/5] overflow-hidden rounded-media bg-surface">
          <Image
            src={project.src}
            alt={project.alt}
            width={project.width}
            height={project.height}
            quality={92}
            sizes={
              featured
                ? "(max-width: 1240px) 100vw, 1112px"
                : "(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            }
            className="project-card-image h-full w-full object-cover"
          />
        </div>
        <figcaption className="mt-4 flex items-start justify-between gap-4 px-2 pb-2">
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

        <div className="work-grid mt-14 md:mt-20">
          {featured ? (
            <ProjectCard
              project={featured}
              featured
              className="work-card work-card-featured"
            />
          ) : null}

          <div className="work-gallery mt-8 grid items-start gap-6 md:mt-12 md:grid-cols-12">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                className={`work-card work-card-${index + 1}`}
              />
            ))}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
