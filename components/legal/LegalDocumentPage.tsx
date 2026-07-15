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
      <main className="legal-page">
        <header className="legal-hero">
          <nav aria-label="Навигация по сайту">
            <a href="/">nyraflow</a>
            <a href="/">Вернуться на главную</a>
          </nav>
          <p>{document.eyebrow}</p>
          <h1>{document.title}</h1>
          <p>{document.description}</p>
          <p>Редакция от {document.effectiveDate}</p>
        </header>

        <div className="legal-layout">
          <nav aria-label="Содержание документа">
            <ol>
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
              {document.requisites ? (
                <li>
                  <a href="#requisites">Сведения и реквизиты Исполнителя</a>
                </li>
              ) : null}
            </ol>
          </nav>

          <article className="legal-document">
            {document.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="legal-section scroll-mt-8"
              >
                <p aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>
                ))}
              </section>
            ))}

            {document.requisites ? (
              <section
                id="requisites"
                className="legal-section scroll-mt-8"
              >
                <h2>Сведения и реквизиты Исполнителя</h2>
                {document.requisites.map((requisite, index) => (
                  <p key={`requisite-${index}`}>{requisite}</p>
                ))}
              </section>
            ) : null}

            <aside aria-label="Другой юридический документ">
              <p>Другой юридический документ</p>
              <a href={relatedDocument.href}>{relatedDocument.label}</a>
            </aside>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
