import { SectionContainer } from "./Layout";

const footerLinks = [
  { href: "#work", label: "Работы" },
  { href: "#services", label: "Услуги" },
  { href: "#team", label: "Команда" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Контакты" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="pb-10 pt-8 md:pb-12">
      <SectionContainer className="flex flex-col gap-8 border-t border-line pt-8 md:flex-row md:items-end md:justify-between">
        <nav aria-label="Навигация в подвале">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-11 items-center font-medium text-text-secondary transition-opacity duration-200 hover:opacity-65 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue/25"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-text-secondary">© {new Date().getFullYear()}</p>
      </SectionContainer>
    </footer>
  );
}
