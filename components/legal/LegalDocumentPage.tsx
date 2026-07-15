import type { LegalDocument } from "../../content/legal";
import SiteFooter from "../home/SiteFooter";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export default function LegalDocumentPage({
  document,
}: LegalDocumentPageProps) {
  const relatedDocument =
    document.title === "Договор-оферта"
      ? {
          href: "/privacy",
          label: "Политика обработки персональных данных",
        }
      : { href: "/terms", label: "Договор-оферта" };

  return (
    <>
      <main className="legal-page text-text-primary">
        <header className="legal-hero mx-auto w-full max-w-site px-gutter-mobile pb-12 pt-8 md:px-gutter-tablet md:pb-16 md:pt-10 xl:px-gutter-desktop">
          <nav
            className="legal-print-hidden flex flex-wrap items-center justify-between gap-4"
            aria-label="Навигация по сайту"
          >
            <a
              href="/"
              className="text-lg font-semibold tracking-[-0.02em] text-text-primary"
            >
              nyraflow
            </a>
            <a
              href="/"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-deep hover:text-blue"
            >
              Вернуться на главную
            </a>
          </nav>
          <p className="mt-16 text-xs font-semibold uppercase tracking-[0.16em] text-blue md:mt-24">
            {document.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-balance text-title">
            {document.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary md:text-xl">
            {document.description}
          </p>
          <p className="mt-8 text-sm font-medium text-text-secondary">
            Редакция от {document.effectiveDate}
          </p>
        </header>

        <div className="legal-layout mx-auto w-full max-w-site px-gutter-mobile pb-section-mobile md:px-gutter-tablet md:pb-section-desktop xl:px-gutter-desktop">
          <nav
            className="legal-toc legal-print-hidden border-t border-line pt-6"
            aria-label="Содержание документа"
          >
            <ol className="m-0 list-none space-y-1 p-0">
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block border-l-2 border-transparent py-2 pl-3 text-sm leading-snug text-text-secondary hover:border-blue hover:text-blue-deep"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
              {document.requisites ? (
                <li>
                  <a
                    href="#requisites"
                    className="block border-l-2 border-transparent py-2 pl-3 text-sm leading-snug text-text-secondary hover:border-blue hover:text-blue-deep"
                  >
                    Сведения и реквизиты Исполнителя
                  </a>
                </li>
              ) : null}
            </ol>
          </nav>

          <article className="legal-document">
            {document.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="legal-section scroll-mt-8 py-10 md:py-12"
              >
                <p
                  className="text-xs font-semibold tracking-[0.16em] text-blue"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-[-0.025em] md:text-3xl">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={`${section.id}-${paragraphIndex}`}
                    className="mt-5 max-w-[72ch] text-base leading-7 text-text-secondary"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

            {document.requisites ? (
              <section
                id="requisites"
                className="legal-section scroll-mt-8 py-10 md:py-12"
              >
                <h2 className="max-w-3xl text-2xl font-semibold tracking-[-0.025em] md:text-3xl">
                  Сведения и реквизиты Исполнителя
                </h2>
                {document.requisites.map((requisite, index) => (
                  <p
                    key={`requisite-${index}`}
                    className="mt-5 max-w-[72ch] text-base leading-7 text-text-secondary"
                  >
                    {requisite}
                  </p>
                ))}
              </section>
            ) : null}

            <aside
              className="legal-print-hidden border-t border-line py-10 md:py-12"
              aria-label="Другой юридический документ"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
                Другой юридический документ
              </p>
              <a
                href={relatedDocument.href}
                className="mt-3 inline-flex min-h-11 items-center text-lg font-semibold text-blue-deep hover:text-blue"
              >
                {relatedDocument.label}
              </a>
            </aside>
          </article>
        </div>
      </main>
      <div className="legal-print-hidden">
        <SiteFooter />
      </div>
    </>
  );
}
