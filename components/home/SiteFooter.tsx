import { legalIdentity } from "../../content/legal";

import { SectionContainer } from "./Layout";

const footerLinks = [
  { label: "Работы", href: "/#work" },
  { label: "Услуги", href: "/#services" },
  { label: "Команда", href: "/#team" },
  { label: "FAQ", href: "/#faq" },
  { label: "Контакты", href: "/#contact" },
] as const;

const legalLinks = [
  { label: "Договор-оферта", href: "/terms" },
  { label: "Политика обработки персональных данных", href: "/privacy" },
] as const;

const footerLinkClassName =
  "inline-flex min-h-11 items-center transition-opacity duration-base ease-premium hover:opacity-65";

export default function SiteFooter() {
  return (
    <footer className="pb-10 pt-8 md:pb-12">
      <SectionContainer className="grid gap-10 border-t border-line pt-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div>
          <p className="text-xl font-semibold tracking-[-0.02em]">
            {legalIdentity.brand}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            © {new Date().getFullYear()} {legalIdentity.brand}.
            <br />
            Все права защищены.
          </p>
        </div>

        <nav aria-label="Навигация в подвале">
          <p className="text-sm font-semibold text-text-primary">Навигация</p>
          <ul className="mt-4 space-y-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`font-medium text-text-secondary ${footerLinkClassName}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <address className="not-italic">
          <p className="text-sm font-semibold text-text-primary">Контакты</p>
          <ul className="mt-4 space-y-3 text-text-secondary">
            <li>
              <a
                href={`mailto:${legalIdentity.email}`}
                className={footerLinkClassName}
              >
                {legalIdentity.email}
              </a>
            </li>
            <li>
              <a
                href={legalIdentity.phoneHref}
                className={footerLinkClassName}
              >
                {legalIdentity.phoneLabel}
              </a>
            </li>
            <li>
              <a
                href={legalIdentity.telegramHref}
                target="_blank"
                rel="noreferrer noopener"
                className={footerLinkClassName}
              >
                {legalIdentity.telegramLabel}
              </a>
            </li>
          </ul>
        </address>

        <div>
          <p className="text-sm font-semibold text-text-primary">
            Правовая информация
          </p>
          <p className="mt-4 text-sm font-medium leading-relaxed">
            {legalIdentity.fullName}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {legalIdentity.status}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            ИНН {legalIdentity.inn}
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`text-blue-deep ${footerLinkClassName}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </SectionContainer>
    </footer>
  );
}
