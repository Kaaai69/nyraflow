import Image from "next/image";
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
  "inline-flex min-h-11 items-center transition-opacity duration-base ease-premium hover:opacity-100 opacity-70";

export default function SiteFooter() {
  return (
    <footer className="pb-12 pt-10 bg-transparent text-[#FFFFFF]">
      <SectionContainer className="grid gap-10 border-t border-white/18 pt-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div>
          <a href="#" className="inline-block">
            <Image
              src="/nyraflow-logo.png"
              alt="nyraflow logo"
              width={160}
              height={40}
              className="h-9 w-auto object-contain invert brightness-200"
            />
          </a>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            © {new Date().getFullYear()} {legalIdentity.brand}.
            <br />
            Все права защищены.
          </p>
        </div>

        <nav aria-label="Навигация в подвале">
          <p className="text-sm font-bold text-white uppercase tracking-wider">Навигация</p>
          <ul className="mt-4 space-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`font-medium text-white ${footerLinkClassName}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <address className="not-italic">
          <p className="text-sm font-bold text-white uppercase tracking-wider">Контакты</p>
          <ul className="mt-4 space-y-2 text-white">
            <li>
              <a
                href={`mailto:${legalIdentity.email}`}
                className={`hover:text-white ${footerLinkClassName}`}
              >
                {legalIdentity.email}
              </a>
            </li>
            <li>
              <a
                href={legalIdentity.phoneHref}
                className={`hover:text-white ${footerLinkClassName}`}
              >
                {legalIdentity.phoneLabel}
              </a>
            </li>
            <li>
              <a
                href={legalIdentity.telegramHref}
                target="_blank"
                rel="noreferrer noopener"
                className={`hover:text-white ${footerLinkClassName}`}
              >
                {legalIdentity.telegramLabel}
              </a>
            </li>
          </ul>
        </address>

        <div>
          <p className="text-sm font-bold text-white uppercase tracking-wider">
            Правовая информация
          </p>
          <p className="mt-4 text-sm font-medium leading-relaxed text-white">
            {legalIdentity.fullName}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            {legalIdentity.status}
          </p>
          <p className="mt-2 text-sm text-white/60">
            ИНН {legalIdentity.inn}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`text-white/80 underline hover:text-white ${footerLinkClassName}`}
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
