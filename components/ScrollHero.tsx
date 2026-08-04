import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

import { mobileHeroContent } from "../content/mobile-hero";

import { ScrollImageSequence } from "./ScrollImageSequence";

export default function ScrollHero() {
  const content = mobileHeroContent;

  return (
    <section
      id="top"
      data-testid="scroll-hero"
      className="scroll-hero"
    >
      <ScrollImageSequence
        basePath="/animation/tunnel"
        frameCount={90}
        scrollDistance={1900}
        mobileScrollDistance={1300}
        ariaLabel="Абстрактная пространственная форма, меняющаяся при прокрутке"
        fit="responsive"
        className="scroll-hero__sequence"
      />

      <div className="scroll-hero__overlay">
        <header className="scroll-hero__header">
          <a
            className="scroll-hero__wordmark"
            href={content.brand.href}
            aria-label={`${content.brand.label}: на главную`}
          >
            <Image
              src="/images/brand/lockup-transparent.png"
              alt={content.brand.label}
              width={1027}
              height={164}
              priority
              className="scroll-hero__logo"
            />
          </a>

          <nav aria-label="Навигация первого экрана">
            <ul className="scroll-hero__navigation">
              {content.navigation.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div className="scroll-hero__content">
          <h1>{content.title}</h1>
          <p>{content.description}</p>
          <div className="scroll-hero__actions">
            <a className="scroll-hero__primary" href={content.primaryAction.href}>
              {content.primaryAction.label}
              <ArrowRight aria-hidden size={20} weight="bold" />
            </a>
            <a
              className="scroll-hero__secondary"
              href={content.secondaryAction.href}
            >
              {content.secondaryAction.label}
              <ArrowRight aria-hidden size={18} weight="bold" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
