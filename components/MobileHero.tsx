import { ArrowRight } from "@phosphor-icons/react/ssr";

import { mobileHeroContent } from "../content/mobile-hero";

export default function MobileHero() {
  const content = mobileHeroContent;

  return (
    <section
      id="top"
      data-testid="mobile-hero"
      className="mobile-hero relative isolate flex min-w-0 flex-col overflow-hidden px-gutter-mobile md:hidden"
    >
      <header className="mobile-hero-header relative z-10 flex min-h-11 items-center justify-between gap-5">
        <a
          className="mobile-hero-wordmark inline-flex min-h-11 items-center"
          href={content.brand.href}
        >
          {content.brand.label}
        </a>
        <nav aria-label="Навигация первого экрана">
          <ul className="flex items-center gap-5 text-sm text-text-secondary">
            {content.navigation.map((item) => (
              <li key={item.href}>
                <a
                  className="inline-flex min-h-11 items-center whitespace-nowrap"
                  href={item.href}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="relative z-10 mt-12 max-w-[34rem]">
        <h1 className="mobile-hero-title font-medium text-text-primary">
          {content.title}
        </h1>
        <p className="mt-5 max-w-[31rem] text-base leading-[1.55] text-text-secondary">
          {content.description}
        </p>
        <div className="mt-7 flex flex-col items-start gap-3">
          <a
            className="button-primary inline-flex min-w-[13.5rem] justify-between gap-4"
            href={content.primaryAction.href}
          >
            {content.primaryAction.label}
            <ArrowRight aria-hidden size={20} weight="bold" />
          </a>
          <a
            className="mobile-hero-secondary-action inline-flex min-h-11 items-center gap-2 whitespace-nowrap px-1 font-medium text-blue"
            href={content.secondaryAction.href}
          >
            {content.secondaryAction.label}
            <ArrowRight aria-hidden size={18} weight="bold" />
          </a>
        </div>
      </div>
    </section>
  );
}
