import Image from "next/image";
import { ArrowRight, CaretDown } from "@phosphor-icons/react/ssr";

import { mobileHeroContent } from "../content/mobile-hero";

export default function MobileHero() {
  const content = mobileHeroContent;

  return (
    <section
      id="top"
      data-testid="mobile-hero"
      className="mobile-hero relative isolate flex min-w-0 flex-col overflow-hidden px-gutter-mobile md:hidden"
    >
      <nav aria-label="Навигация первого экрана" className="relative z-10">
        <ul className="flex items-center justify-center gap-6 text-sm text-text-secondary">
          {content.navigation.map((item) => (
            <li key={item.href}>
              <a className="inline-flex min-h-11 items-center" href={item.href}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative z-10 mt-10 max-w-[34rem]">
        <h1 className="text-[clamp(2.5rem,11vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.045em] text-text-primary">
          {content.title}
        </h1>
        <p className="mt-6 max-w-[31rem] text-base leading-relaxed text-text-secondary">
          {content.description}
        </p>
        <div className="mt-7 grid gap-3 min-[390px]:grid-cols-2">
          <a
            className="button-primary inline-flex justify-between gap-4"
            href={content.primaryAction.href}
          >
            {content.primaryAction.label}
            <ArrowRight aria-hidden size={20} weight="bold" />
          </a>
          <a
            className="button-secondary inline-flex min-h-12 items-center justify-between gap-4 rounded-full border border-blue px-6 font-semibold text-blue"
            href={content.secondaryAction.href}
          >
            {content.secondaryAction.label}
            <ArrowRight aria-hidden size={20} weight="bold" />
          </a>
        </div>
      </div>

      <div
        className="pointer-events-none relative mt-3 min-h-52 flex-1"
        aria-hidden
      >
        <div className="mobile-hero-art-frame">
          <Image
            {...content.visual}
            priority
            sizes="100vw"
            className="mobile-hero-art absolute mx-auto h-auto object-contain"
          />
        </div>
      </div>

      <CaretDown
        aria-hidden
        className="relative z-10 mx-auto mt-2 shrink-0 text-text-secondary"
        size={28}
      />
    </section>
  );
}
