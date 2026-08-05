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
  "inline-flex min-h-11 items-center transition-opacity duration-base ease-premium hover:opacity-75";

export default function SiteFooter() {
  return (
    <footer className="pb-10 pt-8 md:pb-12 bg-[#0B0C0E] text-[#F1F5F9]">
      <SectionContainer className="grid gap-10 border-t border-white/10 pt-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div>
          <p className="text-xl font-semibold tracking-[-0.02em] text-[#F1F5F9]">
            {legalIdentity.brand}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#94A3B8]">
            © {new Date().getFullYear()} {legalIdentity.brand}.
            <br />
            Все права защищены.
          </p>
        </div>

        <nav aria-label="Навигация в подвале">
          <p className="text-sm font-semibold text-[#F1F5F9]">Навигация</p>
          <ul className="mt-4 space-y-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`font-medium text-[#94A3B8] hover:text-[#F1F5F9] ${footerLinkClassName}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <address className="not-italic">
          <p className="text-sm font-semibold text-[#F1F5F9]">Контакты</p>
          <ul className="mt-4 space-y-3 text-[#94A3B8]">
            <li>
              <a
                href={`mailto:${legalIdentity.email}`}
                className={`hover:text-[#F1F5F9] ${footerLinkClassName}`}
              >
                {legalIdentity.email}
              </a>
            </li>
            <li>
              <a
                href={legalIdentity.phoneHref}
                className={`hover:text-[#F1F5F9] ${footerLinkClassName}`}
              >
                {legalIdentity.phoneLabel}
              </a>
            </li>
            <li>
              <a
                href={legalIdentity.telegramHref}
                target="_blank"
                rel="noreferrer noopener"
                className={`hover:text-[#F1F5F9] ${footerLinkClassName}`}
              >
                {legalIdentity.telegramLabel}
              </a>
            </li>
          </ul>
        </address>

        <div>
          <p className="text-sm font-semibold text-[#F1F5F9]">
            Правовая информация
          </p>
          <p className="mt-4 text-sm font-medium leading-relaxed text-[#F1F5F9]">
            {legalIdentity.fullName}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
            {legalIdentity.status}
          </p>
          <p className="mt-2 text-sm text-[#94A3B8]">
            ИНН {legalIdentity.inn}
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`text-[#38BDF8] hover:underline ${footerLinkClassName}`}
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
